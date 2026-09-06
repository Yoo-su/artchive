/**
 * 알라딘 표지 원본을 내려받아 로컬에 보관하는 스크립트.
 *
 * `docs/book-data-migration-plan.md` Phase 0의 비가역 작업입니다. 알라딘 API가
 * 2026-10-30에 종료되면 cover500 화질의 국내 도서 표지를 다시 구할 방법이
 * 없습니다. 그래서 가공은 하지 않고 원본 그대로 받아 둡니다. WebP 변환과
 * 리사이즈는 Phase 2에서 이 원본을 입력으로 삼습니다.
 *
 * 입력은 `export-cover-targets.ts`가 만든 JSONL이고, 결과는 파일과 매니페스트
 * 두 가지로 남습니다. 매니페스트는 이후 DB 컷오버와 롤백의 근거가 됩니다.
 *
 * 중단해도 안전합니다. 매니페스트에 기록된 ISBN은 다시 받지 않으므로 같은
 * 명령을 다시 실행하면 이어서 진행합니다.
 *
 * 사용법:
 *   pnpm --filter @bookjeok/server exec ts-node scripts/fetch-cover-originals.ts
 *
 * 환경 변수:
 *   COVERS_DIR         저장 위치 (기본 cover-originals)
 *   COVERS_INPUT       입력 JSONL (기본 covers-manifest-input.jsonl)
 *   COVERS_CONCURRENCY 동시 요청 수 (기본 6)
 *   COVERS_RPS         초당 요청 상한 (기본 5)
 *   COVERS_LIMIT       처리 건수 상한 (시범 실행용)
 */
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const outDir = resolve(process.env.COVERS_DIR ?? 'cover-originals');
const inputPath = resolve(
  process.env.COVERS_INPUT ?? 'covers-manifest-input.jsonl',
);
const manifestPath = join(outDir, 'manifest.jsonl');
const concurrency = Number(process.env.COVERS_CONCURRENCY ?? 6);
const rps = Number(process.env.COVERS_RPS ?? 5);
const limit = process.env.COVERS_LIMIT
  ? Number(process.env.COVERS_LIMIT)
  : Infinity;

const USER_AGENT =
  'bookjeok-cover-archiver/1.0 (migration before Aladin API shutdown)';
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 20_000;

interface Target {
  isbn: string;
  originalUrl: string;
  fetchUrl: string;
}

interface ManifestEntry {
  isbn: string;
  ok: boolean;
  sourceUrl?: string;
  requestedUrl?: string;
  storedPath?: string;
  bytes?: number;
  sha256?: string;
  contentType?: string;
  httpStatus?: number;
  usedFallback?: boolean;
  attempts?: number;
  error?: string;
  fetchedAt: string;
}

/** ISBN 끝 두 자리로 디렉터리를 나눈다. 한 폴더에 5만 개를 넣지 않기 위함. */
function shardDir(isbn: string): string {
  return isbn.slice(-2).padStart(2, '0');
}

/** 매직 바이트로 실제 이미지인지 본다. 알라딘이 에러 페이지를 200으로 주는 경우 대비. */
function sniffImage(buf: Buffer): string | null {
  if (buf.length < 4) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return 'png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'webp';
  return null;
}

/** 초당 요청 수를 시작 시점 간격으로 제한한다. */
class RateGate {
  private next = 0;
  constructor(private readonly intervalMs: number) {}
  async wait(): Promise<void> {
    const now = Date.now();
    const at = Math.max(now, this.next);
    this.next = at + this.intervalMs;
    if (at > now) await new Promise((r) => setTimeout(r, at - now));
  }
}

const gate = new RateGate(rps > 0 ? 1000 / rps : 0);

async function readTargets(): Promise<Target[]> {
  const targets: Target[] = [];
  const rl = createInterface({
    input: createReadStream(inputPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    targets.push(JSON.parse(line) as Target);
  }
  return targets;
}

/** 이미 처리한 ISBN을 매니페스트에서 읽는다. 중단 후 이어받기의 근거. */
function readDone(): Set<string> {
  const done = new Set<string>();
  if (!existsSync(manifestPath)) return done;
  for (const line of readFileSync(manifestPath, 'utf-8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line) as ManifestEntry;
      if (e.ok) done.add(e.isbn);
    } catch {
      // 중단 시점에 잘린 줄은 무시한다
    }
  }
  return done;
}

async function fetchOnce(
  url: string,
): Promise<{ status: number; buf?: Buffer; contentType?: string }> {
  await gate.wait();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
    });
    if (!res.ok) return { status: res.status };
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      status: res.status,
      buf,
      contentType: res.headers.get('content-type') ?? undefined,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function processOne(t: Target): Promise<ManifestEntry> {
  const at = () => new Date().toISOString();
  let lastStatus = 0;
  let lastError = '';

  // cover500을 먼저 시도하고, 없으면 DB에 있던 원래 URL로 폴백한다.
  const candidates =
    t.fetchUrl === t.originalUrl ? [t.fetchUrl] : [t.fetchUrl, t.originalUrl];

  for (let ci = 0; ci < candidates.length; ci += 1) {
    const url = candidates[ci];
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const { status, buf, contentType } = await fetchOnce(url);
        lastStatus = status;

        if (status === 404) break; // 다음 후보 URL로
        if (status === 429 || status >= 500) {
          if (attempt < MAX_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, 2000 * 2 ** (attempt - 1)));
            continue;
          }
          break;
        }
        if (!buf || buf.length === 0) {
          lastError = '빈 응답';
          continue;
        }

        const kind = sniffImage(buf);
        if (!kind) {
          lastError = `이미지가 아님 (${buf.length}B, ${contentType ?? '?'})`;
          break;
        }

        const dir = join(outDir, shardDir(t.isbn));
        mkdirSync(dir, { recursive: true });
        const storedPath = join(dir, `${t.isbn}.${kind}`);
        writeFileSync(storedPath, buf);

        return {
          isbn: t.isbn,
          ok: true,
          sourceUrl: t.originalUrl,
          requestedUrl: url,
          storedPath,
          bytes: buf.length,
          sha256: createHash('sha256').update(buf).digest('hex'),
          contentType,
          httpStatus: status,
          usedFallback: ci > 0,
          attempts: attempt,
          fetchedAt: at(),
        };
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 1500 * 2 ** (attempt - 1)));
        }
      }
    }
  }

  return {
    isbn: t.isbn,
    ok: false,
    sourceUrl: t.originalUrl,
    requestedUrl: t.fetchUrl,
    httpStatus: lastStatus,
    error: lastError || `HTTP ${lastStatus}`,
    fetchedAt: at(),
  };
}

let stopping = false;
process.on('SIGINT', () => {
  console.log('\n중단 요청 감지. 진행 중인 요청을 마치고 종료합니다...');
  stopping = true;
});

async function main() {
  if (!existsSync(inputPath)) {
    console.error(
      `입력 파일이 없습니다: ${inputPath}\n먼저 export-cover-targets.ts를 실행하세요.`,
    );
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  mkdirSync(dirname(manifestPath), { recursive: true });

  const all = await readTargets();
  const done = readDone();
  const todo = all.filter((t) => !done.has(t.isbn)).slice(0, limit);

  console.log(`전체 대상   ${all.length.toLocaleString()}건`);
  console.log(`이미 완료   ${done.size.toLocaleString()}건`);
  console.log(`이번 실행   ${todo.length.toLocaleString()}건`);
  console.log(`동시 ${concurrency} / 초당 ${rps} / 저장 ${outDir}\n`);

  if (todo.length === 0) {
    console.log('받을 것이 없습니다.');
    return;
  }

  const started = Date.now();
  let cursor = 0;
  let ok = 0;
  let fail = 0;
  let bytes = 0;
  let fallback = 0;

  async function worker() {
    while (!stopping) {
      const i = cursor;
      cursor += 1;
      if (i >= todo.length) return;

      const entry = await processOne(todo[i]);
      appendFileSync(manifestPath, JSON.stringify(entry) + '\n');

      if (entry.ok) {
        ok += 1;
        bytes += entry.bytes ?? 0;
        if (entry.usedFallback) fallback += 1;
      } else {
        fail += 1;
      }

      const seen = ok + fail;
      if (seen % 200 === 0 || seen === todo.length) {
        const elapsed = (Date.now() - started) / 1000;
        const rate = seen / elapsed;
        const eta = (todo.length - seen) / (rate || 1);
        console.log(
          `${seen.toLocaleString()}/${todo.length.toLocaleString()}  ` +
            `성공 ${ok.toLocaleString()} 실패 ${fail.toLocaleString()}  ` +
            `${(bytes / 1024 / 1024).toFixed(0)}MB  ` +
            `${rate.toFixed(1)}건/s  남은시간 ${(eta / 60).toFixed(0)}분`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => worker()),
  );

  const elapsed = (Date.now() - started) / 1000;
  console.log(`\n${'='.repeat(56)}`);
  console.log(`처리   ${(ok + fail).toLocaleString()}건 / ${(elapsed / 60).toFixed(1)}분`);
  console.log(`성공   ${ok.toLocaleString()}건 (${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB)`);
  console.log(`실패   ${fail.toLocaleString()}건`);
  console.log(`폴백   ${fallback.toLocaleString()}건 (cover500 없어 원래 URL 사용)`);
  console.log(`매니페스트: ${manifestPath}`);
  if (stopping) console.log('\n중단됨. 같은 명령을 다시 실행하면 이어서 받습니다.');
  else if (fail > 0) console.log('\n실패분은 같은 명령을 다시 실행하면 재시도합니다.');
}

main().catch((e) => {
  console.error('수집 실패:', e instanceof Error ? e.message : e);
  process.exit(1);
});
