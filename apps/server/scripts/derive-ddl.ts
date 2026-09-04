/**
 * 운영에 나갈 DDL을 추측하지 않고 뽑아내는 스크립트.
 *
 * `docs/manual-ddl-log.md`에 적힌 절차를 실행 가능한 형태로 옮긴 것입니다.
 * 운영 DB는 `synchronize: false`이므로 사람이 SQL을 직접 돌려야 하는데,
 * 손으로 쓴 DDL은 인덱스 이름이나 제약 이름이 TypeORM이 만드는 것과
 * 어긋나기 쉽습니다. 그래서 "운영과 같은 형태"로 되돌린 사본 DB를 향해
 * TypeORM이 직접 계산한 upQueries를 받아 씁니다.
 *
 * 사용법:
 *   1. 운영과 같은 스키마 상태의 빈 DB를 하나 준비한다
 *      (예: 로컬 postgres에 `bookjeok_ddl` 생성 후 운영 덤프의 스키마만 복원)
 *   2. DDL_TARGET_DATABASE_URL 을 그 DB로 지정해 실행한다
 *
 *   DDL_TARGET_DATABASE_URL=postgres://user:pass@localhost:5432/bookjeok_ddl \
 *     pnpm --filter @bookjeok/server exec ts-node -r tsconfig-paths/register scripts/derive-ddl.ts
 *
 * 출력된 SQL이 곧 운영에 필요한 DDL 전부입니다. 실행 후 반드시
 * `docs/manual-ddl-log.md`에 남기세요.
 */
import 'reflect-metadata';

import { DataSource } from 'typeorm';

const url =
  process.env.DDL_TARGET_DATABASE_URL ?? process.env.DATABASE_URL ?? '';

if (!url) {
  console.error(
    'DDL_TARGET_DATABASE_URL(또는 DATABASE_URL)이 필요합니다.\n' +
      '운영 DB가 아니라 "운영과 같은 형태로 되돌린 사본"을 가리켜야 합니다.',
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    url,
    synchronize: false,
    // 엔티티를 전부 읽어 현재 코드가 기대하는 스키마를 계산한다.
    entities: ['src/**/*.entity.ts'],
  });

  await dataSource.initialize();

  try {
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

    if (sqlInMemory.upQueries.length === 0) {
      console.log('-- 적용할 DDL이 없습니다. 스키마가 이미 최신입니다.');
      return;
    }

    console.log('-- 운영에 적용할 DDL (위에서부터 순서대로)');
    console.log('BEGIN;');
    for (const query of sqlInMemory.upQueries) {
      console.log(`${query.query};`);
    }
    console.log('COMMIT;');

    console.log('\n-- 되돌릴 때 (downQueries, 역순)');
    for (const query of [...sqlInMemory.downQueries].reverse()) {
      console.log(`-- ${query.query};`);
    }
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
