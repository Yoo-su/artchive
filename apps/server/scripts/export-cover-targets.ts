/**
 * 표지 원본 수집 대상 목록을 운영 DB에서 뽑아내는 스크립트. (읽기 전용)
 *
 * `docs/book-data-migration-plan.md` Phase 0. 알라딘 API가 2026-10-30에
 * 종료되므로 그 전에 표지 원본을 확보해야 합니다. 이 스크립트는 무엇을
 * 받을지만 정하고, 실제 내려받기는 `fetch-cover-originals.ts`가 합니다.
 *
 * 대상에서 빼는 것:
 *   - Cloudinary 호스트 — 이미 자체 호스팅 중이라 손댈 이유가 없습니다.
 *   - `noimg` 플레이스홀더 — 표지가 없다는 표시라 받아봐야 의미가 없습니다.
 *
 * 요청 URL은 `cover500`으로 정규화합니다. DB에는 `cover200`이 26% 섞여 있는데
 * 프론트가 렌더 시점에 같은 치환을 하고 있어서(`book-card.tsx`) DB 값 그대로
 * 받으면 지금 서비스보다 화질이 떨어진 채로 굳습니다.
 *
 * 사용법:
 *   SURVEY_DATABASE_URL='postgresql://...' \
 *     pnpm --filter @bookjeok/server exec ts-node scripts/export-cover-targets.ts
 */
import 'reflect-metadata';

import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';

import { formatAladinCoverImage } from '@bookjeok/core';
import { DataSource } from 'typeorm';

const url = process.env.SURVEY_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
const outPath = resolve(
  process.env.TARGETS_OUT ?? 'covers-manifest-input.jsonl',
);

if (!url) {
  console.error('SURVEY_DATABASE_URL(또는 DATABASE_URL)이 필요합니다.');
  process.exit(1);
}

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const dataSource = new DataSource({
  type: 'postgres',
  url,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  entities: [],
  synchronize: false,
  logging: false,
});

interface TargetRow {
  isbn: string;
  image: string;
}

async function main() {
  await dataSource.initialize();
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  await runner.query('BEGIN');
  await runner.query('SET TRANSACTION READ ONLY');

  const rows: TargetRow[] = await runner.query(`
    SELECT isbn, image
    FROM books
    WHERE image LIKE 'https://image.aladin.co.kr/%'
      AND image NOT LIKE '%noimg%'
    ORDER BY isbn
  `);

  await runner.query('ROLLBACK');
  await runner.release();
  await dataSource.destroy();

  const out = createWriteStream(outPath, { encoding: 'utf-8' });
  let normalized = 0;

  for (const row of rows) {
    // 프론트와 같은 함수를 써서 치환 규칙이 어긋나지 않게 한다.
    const fetchUrl = formatAladinCoverImage(row.image);
    if (fetchUrl !== row.image) normalized += 1;

    out.write(
      JSON.stringify({
        isbn: row.isbn,
        originalUrl: row.image,
        fetchUrl,
      }) + '\n',
    );
  }

  await new Promise<void>((res, rej) => {
    out.end((e?: Error) => (e ? rej(e) : res()));
  });

  console.log(`대상 ${rows.length.toLocaleString()}건 → ${outPath}`);
  console.log(`  cover500으로 정규화된 건: ${normalized.toLocaleString()}`);
  console.log(`  이미 cover500이던 건: ${(rows.length - normalized).toLocaleString()}`);
}

main().catch(async (e) => {
  console.error('추출 실패:', e instanceof Error ? e.message : e);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
