/**
 * 표지 마이그레이션 사전 실태 조사 스크립트. (읽기 전용)
 *
 * `docs/book-data-migration-plan.md` Phase 0의 실태 파악 항목을 실행합니다.
 * 알라딘 API가 2026-10-30에 종료되므로 6만여 건의 표지 원본을 그 전에 확보해야
 * 하는데, 수집 스크립트를 제대로 짜려면 먼저 `books.image`가 실제로 어떤
 * 모양인지 알아야 합니다. 호스트가 정말 알라딘 하나인지, cover500이 아닌
 * 경로는 얼마나 되는지, 빈 값은 몇 건인지에 따라 수집 대상과 재시도 전략이
 * 달라집니다.
 *
 * 운영 DB를 향해 도는 스크립트라 트랜잭션을 READ ONLY로 열어 쓰기를 DB
 * 수준에서 차단합니다. SELECT 외에는 아무것도 하지 않습니다.
 *
 * 사용법:
 *   SURVEY_DATABASE_URL='postgresql://...' \
 *     pnpm --filter @bookjeok/server exec ts-node scripts/survey-book-covers.ts
 *
 * 결과는 stdout 요약과 JSON 리포트 파일로 나옵니다. JSON은 수집 대상 산정과
 * 수집 완료 후 대조에 씁니다. 출력 경로는 SURVEY_OUT으로 바꿉니다.
 */
import 'reflect-metadata';

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DataSource, QueryRunner } from 'typeorm';

const url = process.env.SURVEY_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
const outPath = resolve(process.env.SURVEY_OUT ?? 'cover-survey-report.json');

if (!url) {
  console.error(
    'SURVEY_DATABASE_URL(또는 DATABASE_URL)이 필요합니다.\n' +
      "예: SURVEY_DATABASE_URL='postgresql://user:pass@host:5432/db' pnpm --filter @bookjeok/server exec ts-node scripts/survey-book-covers.ts",
  );
  process.exit(1);
}

// 로컬이 아니면 관리형 DB로 보고 TLS를 켠다. Supabase는 체인 검증에 걸린다.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const dataSource = new DataSource({
  type: 'postgres',
  url,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  entities: [],
  synchronize: false,
  logging: false,
});

let runner: QueryRunner | undefined;

/** 접속 대상을 자격증명 없이 사람이 확인할 수 있게 요약한다. */
function describeTarget(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.hostname}:${u.port || '5432'}${u.pathname}`;
  } catch {
    return '(파싱 불가)';
  }
}

type Row = Record<string, unknown>;

const report: Record<string, unknown> = {
  surveyedAt: new Date().toISOString(),
  target: describeTarget(url),
};
const errors: string[] = [];

async function q(sql: string): Promise<Row[]> {
  return (await runner!.query(sql)) as Row[];
}

function section(title: string) {
  console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`);
}

function table(rows: Row[]) {
  if (rows.length === 0) {
    console.log('  (없음)');
    return;
  }
  console.table(rows);
}

/**
 * 구간 하나를 실행한다. 운영을 향해 한 번 도는 스크립트라 쿼리 하나가
 * 실패해도 나머지 결과를 잃지 않게 격리한다.
 */
async function step(label: string, run: () => Promise<void>) {
  section(label);
  try {
    await run();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`  ! 실패: ${msg}`);
    errors.push(`${label}: ${msg}`);
    // Postgres는 에러가 나면 트랜잭션 전체를 abort 상태로 만든다. 다시 연다.
    await runner!.query('ROLLBACK');
    await runner!.query('BEGIN');
    await runner!.query('SET TRANSACTION READ ONLY');
  }
}

async function main() {
  console.log(`대상: ${describeTarget(url)}`);
  await dataSource.initialize();
  runner = dataSource.createQueryRunner();
  await runner.connect();

  // 쓰기를 DB 수준에서 막는다. 운영을 향해 도는 스크립트라 실수 여지를 없앤다.
  await runner.query('BEGIN');
  await runner.query('SET TRANSACTION READ ONLY');

  // 1. 전체 규모와 결측
  await step('1. 전체 규모 / 결측', async () => {
    const [totals] = await q(`
      SELECT
        COUNT(*)::int                                                        AS total_books,
        COUNT(*) FILTER (WHERE image IS NULL)::int                           AS image_null,
        COUNT(*) FILTER (WHERE image = '')::int                              AS image_empty,
        COUNT(*) FILTER (WHERE image IS NOT NULL AND image <> '')::int       AS image_present,
        COUNT(*) FILTER (WHERE description IS NULL OR description = '')::int AS description_missing,
        COUNT(*) FILTER (WHERE discount IS NULL OR discount = '')::int       AS discount_missing
      FROM books
    `);
    console.log(totals);
    report.totals = totals;
  });

  // 1-b. embedding은 pgvector 확장이 있는 환경에만 있다. 없어도 조사는 계속한다.
  await step('1-b. 임베딩 적재 현황', async () => {
    const [emb] = await q(`
      SELECT COUNT(*) FILTER (WHERE embedding IS NOT NULL)::int AS embedding_present
      FROM books
    `);
    console.log(emb);
    report.embedding = emb;
  });

  // 2. 표지 호스트 분포. 알라딘 외 호스트가 섞여 있으면 수집 경로가 갈린다.
  await step('2. 표지 호스트 분포', async () => {
    const hosts = await q(`
      SELECT
        split_part(split_part(image, '://', 2), '/', 1) AS host,
        COUNT(*)::int                                   AS count
      FROM books
      WHERE image IS NOT NULL AND image <> ''
      GROUP BY 1
      ORDER BY 2 DESC
    `);
    table(hosts);
    report.hosts = hosts;
  });

  // 3. 스킴. http면 수집 시 https로 올려야 한다.
  await step('3. 스킴 분포', async () => {
    const schemes = await q(`
      SELECT split_part(image, '://', 1) AS scheme, COUNT(*)::int AS count
      FROM books
      WHERE image IS NOT NULL AND image <> ''
      GROUP BY 1 ORDER BY 2 DESC
    `);
    table(schemes);
    report.schemes = schemes;
  });

  // 4. 커버 해상도 경로. cover500이 아닌 건 더 큰 판본을 다시 노려야 한다.
  await step('4. 커버 해상도 경로 분포', async () => {
    const coverPaths = await q(`
      SELECT
        COALESCE(substring(image FROM '/(cover[a-z0-9]*)/'), '(경로패턴 없음)') AS cover_path,
        COUNT(*)::int                                                          AS count
      FROM books
      WHERE image IS NOT NULL AND image <> ''
      GROUP BY 1 ORDER BY 2 DESC
    `);
    table(coverPaths);
    report.coverPaths = coverPaths;
  });

  // 5. 확장자. 원본 보관 시 content-type 검증 기준이 된다.
  await step('5. 확장자 분포', async () => {
    const exts = await q(`
      SELECT
        lower(COALESCE(substring(image FROM '[.]([A-Za-z0-9]{2,4})$'), '(없음)')) AS ext,
        COUNT(*)::int AS count
      FROM books
      WHERE image IS NOT NULL AND image <> ''
      GROUP BY 1 ORDER BY 2 DESC
    `);
    table(exts);
    report.extensions = exts;
  });

  // 6. 중복 URL. 여러 ISBN이 같은 이미지를 쓰면 실제 내려받을 파일 수가 준다.
  await step('6. URL 중복도', async () => {
    const [dup] = await q(`
      SELECT
        COUNT(*)::int                                     AS distinct_urls,
        COALESCE(SUM(cnt) FILTER (WHERE cnt > 1), 0)::int AS rows_sharing_url,
        COALESCE(MAX(cnt), 0)::int                        AS max_isbn_per_url
      FROM (
        SELECT image, COUNT(*)::int AS cnt
        FROM books
        WHERE image IS NOT NULL AND image <> ''
        GROUP BY image
      ) s
    `);
    console.log(dup);
    report.duplication = dup;
  });

  // 7. ISBN 형식. 13자리가 아닌 값은 국중 API 조회 시 별도 처리가 필요하다.
  await step('7. ISBN 길이 분포', async () => {
    const isbnShapes = await q(`
      SELECT length(isbn) AS isbn_length, COUNT(*)::int AS count
      FROM books
      GROUP BY 1 ORDER BY 2 DESC
    `);
    table(isbnShapes);
    report.isbnShapes = isbnShapes;
  });

  // 8. 눈으로 볼 샘플. 경로 패턴별로 하나씩 뽑는다.
  await step('8. 경로 패턴별 샘플', async () => {
    const samples = await q(`
      SELECT DISTINCT ON (cover_path) cover_path, isbn, image
      FROM (
        SELECT
          COALESCE(substring(image FROM '/(cover[a-z0-9]*)/'), '(없음)') AS cover_path,
          isbn, image
        FROM books
        WHERE image IS NOT NULL AND image <> ''
      ) s
      ORDER BY cover_path, isbn
    `);
    table(samples);
    report.samples = samples;
  });

  await runner.query('ROLLBACK');
  await runner.release();
  await dataSource.destroy();

  report.errors = errors;
  writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  section('완료');
  console.log(`리포트 저장: ${outPath}`);
  if (errors.length > 0) {
    console.log(`\n실패한 구간 ${errors.length}개:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
  console.log(
    '\n다음 단계: docs/book-data-migration-plan.md Phase 0의 "cover500보다 큰 변형 탐색" 항목',
  );
}

main().catch(async (e) => {
  console.error('조사 실패:', e instanceof Error ? e.message : e);
  try {
    await runner?.query('ROLLBACK');
    await runner?.release();
    if (dataSource.isInitialized) await dataSource.destroy();
  } catch {
    // 이미 끊긴 연결은 무시
  }
  process.exit(1);
});
