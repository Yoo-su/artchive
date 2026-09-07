/**
 * 자체 DB 도서 검색 성능 측정 스크립트. (읽기 전용)
 *
 * `docs/book-data-migration-plan.md` Phase 3의 선행 측정입니다. 알라딘 종료로
 * 자체 DB를 검색 경로로 올려야 하는데, `books`에는 PK(isbn) 말고 인덱스가
 * 없어 `LocalDbBookCatalogProvider.search()`의 `ILIKE '%q%'`가 풀스캔입니다.
 *
 * 인덱스를 고르기 전에 재는 것이 목적입니다. 무엇을 설치할지가 아래 두 가지로
 * 갈리기 때문입니다.
 * - pg_trgm: 이미 설치돼 있어 인덱스 생성만 하면 됩니다. 다만 3-gram이라
 *   '%한강%' 같은 2글자 부분일치는 패턴에서 트라이그램을 뽑을 수 없어
 *   인덱스가 걸리지 않습니다.
 * - pgroonga: CJK에 맞고 짧은 질의도 처리하지만 확장 설치가 필요합니다.
 *
 * 실제 검색어의 길이 분포와 길이 그룹별 실측 시간이 결정 근거이며,
 * 이 스크립트는 그 둘을 뽑습니다.
 *
 * 운영 DB를 향해 도는 스크립트라 트랜잭션을 READ ONLY로 열어 쓰기를 DB
 * 수준에서 차단합니다. SELECT와 EXPLAIN 외에는 아무것도 하지 않으며,
 * 인덱스를 만들지도 지우지도 않습니다.
 *
 * 사용법:
 *   SEARCH_DATABASE_URL='postgresql://...' \
 *     pnpm --filter @bookjeok/server exec ts-node scripts/measure-book-search.ts
 *
 * 결과는 stdout 요약과 JSON 리포트로 나옵니다. 출력 경로는 SEARCH_OUT으로 바꿉니다.
 */
import 'reflect-metadata';

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DataSource, QueryRunner } from 'typeorm';

const url =
  process.env.SEARCH_DATABASE_URL ??
  process.env.SURVEY_DATABASE_URL ??
  process.env.DATABASE_URL ??
  '';
const outPath = resolve(process.env.SEARCH_OUT ?? 'book-search-report.json');

if (!url) {
  console.error(
    'SEARCH_DATABASE_URL(또는 SURVEY_DATABASE_URL / DATABASE_URL)이 필요합니다.\n' +
      "예: SEARCH_DATABASE_URL='postgresql://user:pass@host:5432/db' pnpm --filter @bookjeok/server exec ts-node scripts/measure-book-search.ts",
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
type PlanNode = { 'Node Type'?: string; Plans?: PlanNode[] };

const report: Record<string, unknown> = {
  measuredAt: new Date().toISOString(),
  target: describeTarget(url),
};
const errors: string[] = [];

async function q(sql: string, params?: unknown[]): Promise<Row[]> {
  return (await runner!.query(sql, params)) as Row[];
}

function section(title: string) {
  console.log(`\n${'='.repeat(64)}\n${title}\n${'='.repeat(64)}`);
}

function table(rows: Row[]) {
  if (rows.length === 0) {
    console.log('  (없음)');
    return;
  }
  console.table(rows);
}

/** 구간 하나를 실행한다. 쿼리 하나가 실패해도 나머지 결과를 잃지 않게 격리한다. */
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

/*
 * `LocalDbBookCatalogProvider.search()`가 실제로 만드는 두 쿼리.
 * `getManyAndCount()`는 목록과 COUNT를 따로 날리므로 둘 다 잰다.
 * COUNT는 LIMIT의 혜택을 받지 못해 보통 이쪽이 더 비싸다.
 */
const LIST_SQL = `
  SELECT book.isbn, book.title, book.author
  FROM books book
  WHERE book.title ILIKE $1 OR book.author ILIKE $1
  LIMIT 10 OFFSET 0
`;
const COUNT_SQL = `
  SELECT COUNT(1)::int AS n
  FROM books book
  WHERE book.title ILIKE $1 OR book.author ILIKE $1
`;

/** 계획 트리에서 Scan 노드 종류를 모은다. 인덱스를 탔는지 한눈에 보려는 것이다. */
function collectScans(node: PlanNode | undefined): string[] {
  if (!node) return [];
  const self = String(node['Node Type'] ?? '');
  const found = self.includes('Scan') ? [self] : [];
  return [...found, ...(node.Plans ?? []).flatMap(collectScans)];
}

/** EXPLAIN (ANALYZE) 결과에서 실행 시간과 스캔 방식을 뽑는다. */
async function explain(sql: string, keyword: string) {
  const rows = await q(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, [
    `%${keyword}%`,
  ]);
  const plan = rows[0]['QUERY PLAN'] as Array<{
    'Execution Time': number;
    'Planning Time': number;
    Plan: PlanNode;
  }>;
  const root = plan[0];
  return {
    execMs: Number(root['Execution Time']),
    planMs: Number(root['Planning Time']),
    scans: collectScans(root.Plan).join(' + ') || '(없음)',
  };
}

async function main() {
  console.log(`대상: ${describeTarget(url)}`);
  await dataSource.initialize();
  runner = dataSource.createQueryRunner();
  await runner.connect();

  // 쓰기를 DB 수준에서 막는다. 운영을 향해 도는 스크립트라 실수 여지를 없앤다.
  await runner.query('BEGIN');
  await runner.query('SET TRANSACTION READ ONLY');

  // 1. 규모와 인덱스 현황
  await step('1. books 규모 / 인덱스 현황', async () => {
    const [size] = await q(`
      SELECT
        (SELECT COUNT(*)::int FROM books)               AS total_books,
        pg_size_pretty(pg_table_size('books'))          AS table_size,
        pg_size_pretty(pg_indexes_size('books'))        AS index_size,
        pg_size_pretty(pg_total_relation_size('books')) AS total_size
    `);
    console.log(size);
    report.size = size;

    const indexes = await q(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'books'
      ORDER BY indexname
    `);
    table(indexes);
    report.indexes = indexes;
  });

  // 2. 확장 상태 — 무엇을 쓸 수 있는지가 선택지를 정한다.
  await step('2. 전문검색 확장 상태', async () => {
    const exts = await q(`
      SELECT
        a.name,
        a.default_version                  AS available,
        COALESCE(i.extversion, '(미설치)') AS installed
      FROM pg_available_extensions a
      LEFT JOIN pg_extension i ON i.extname = a.name
      WHERE a.name IN ('pg_trgm', 'pgroonga', 'pg_bigm', 'vector', 'unaccent')
      ORDER BY a.name
    `);
    table(exts);
    report.extensions = exts;
  });

  // 3. 실제 검색어 분포 — pg_trgm으로 충분한지가 여기서 갈린다.
  await step('3. 실제 검색어 길이 분포 (search_keywords)', async () => {
    const [totals] = await q(`
      SELECT
        COUNT(*)::int                                          AS distinct_keywords,
        COALESCE(SUM("searchCount"), 0)::bigint                 AS total_searches,
        COUNT(*) FILTER (WHERE char_length(keyword) <= 2)::int  AS short_keywords,
        COALESCE(
          SUM("searchCount") FILTER (WHERE char_length(keyword) <= 2), 0
        )::bigint                                               AS short_searches
      FROM search_keywords
    `);
    console.log(totals);

    const short = Number(totals.short_searches);
    const all = Number(totals.total_searches);
    const ratio = all > 0 ? (short / all) * 100 : 0;
    console.log(`\n  → 2글자 이하 검색이 전체 검색의 ${ratio.toFixed(1)}%`);
    console.log(
      '    이 비율이 높으면 pg_trgm을 깔아도 그만큼은 계속 풀스캔으로 남습니다.',
    );

    const dist = await q(`
      SELECT
        char_length(keyword)                    AS len,
        COUNT(*)::int                           AS keywords,
        COALESCE(SUM("searchCount"), 0)::bigint AS searches
      FROM search_keywords
      GROUP BY 1
      ORDER BY 1
    `);
    table(dist);

    report.keywordStats = {
      ...totals,
      shortSearchRatioPct: Number(ratio.toFixed(1)),
    };
    report.keywordLengthDistribution = dist;
  });

  // 4. 실측 — 인기 검색어에 짧은 검색어를 섞어 길이 그룹별로 본다.
  await step('4. 현재 쿼리 실측 (인덱스 없는 상태)', async () => {
    const popular = await q(`
      SELECT keyword FROM search_keywords
      ORDER BY "searchCount" DESC NULLS LAST
      LIMIT 15
    `);
    // 2글자 검색이 인기 상위에 없어도 반드시 표본에 포함되게 한다.
    const shortOnes = await q(`
      SELECT keyword FROM search_keywords
      WHERE char_length(keyword) <= 2
      ORDER BY "searchCount" DESC NULLS LAST
      LIMIT 5
    `);

    const seen = new Set<string>();
    const keywords: string[] = [];
    for (const row of [...popular, ...shortOnes]) {
      const k = String(row.keyword ?? '').trim();
      if (k && !seen.has(k)) {
        seen.add(k);
        keywords.push(k);
      }
    }

    // 실제 검색어가 없는 환경(스테이징 등)에서도 측정이 되도록 대비한다.
    if (keywords.length === 0) {
      keywords.push('한강', '김훈', '채식주의자', '문학동네', '소년이 온다');
      console.log('  (search_keywords가 비어 있어 대표 검색어로 대신합니다)');
    }

    const results: Row[] = [];
    for (const keyword of keywords) {
      // 네트워크 왕복까지 포함한 체감 시간. 서버-DB 거리 영향을 함께 본다.
      const t0 = Date.now();
      await q(LIST_SQL, [`%${keyword}%`]);
      const listWallMs = Date.now() - t0;

      const t1 = Date.now();
      const [{ n }] = await q(COUNT_SQL, [`%${keyword}%`]);
      const countWallMs = Date.now() - t1;

      const list = await explain(LIST_SQL, keyword);
      const count = await explain(COUNT_SQL, keyword);

      results.push({
        keyword,
        len: [...keyword].length,
        hits: Number(n),
        list_ms: Number(list.execMs.toFixed(1)),
        count_ms: Number(count.execMs.toFixed(1)),
        wall_ms: listWallMs + countWallMs,
        scan: list.scans,
      });
    }
    table(results);
    report.measurements = results;

    const group = (pick: (len: number) => boolean) => {
      const rows = results.filter((r) => pick(Number(r.len)));
      if (rows.length === 0) return null;
      const avg = (key: string) =>
        rows.reduce((s, r) => s + Number(r[key]), 0) / rows.length;
      return {
        keywords: rows.length,
        avg_list_ms: Number(avg('list_ms').toFixed(1)),
        avg_count_ms: Number(avg('count_ms').toFixed(1)),
        avg_wall_ms: Math.round(avg('wall_ms')),
      };
    };

    const summary = {
      '2글자 이하': group((l) => l <= 2),
      '3글자 이상': group((l) => l >= 3),
    };
    console.log('\n길이 그룹별 평균:');
    console.log(summary);
    report.summary = summary;
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
  console.log(`
판정 기준 (docs/book-data-migration-plan.md Phase 3):

  · 전 구간이 이미 충분히 빠르다   → 인덱스를 미루고 다른 일을 먼저 한다
  · 느리고 2글자 검색 비중이 낮다  → pg_trgm (이미 설치됨. 인덱스 생성만)
  · 느리고 2글자 검색 비중이 높다  → pgroonga (확장 설치 필요)

'scan' 열이 전부 Seq Scan인 것은 지금으로선 정상입니다. 인덱스가 PK뿐입니다.
이 값은 인덱스를 만든 뒤 다시 돌려 Bitmap Index Scan으로 바뀌는지 확인하는
대조군입니다.`);
}

main().catch(async (e) => {
  console.error('측정 실패:', e instanceof Error ? e.message : e);
  try {
    await runner?.query('ROLLBACK');
    await runner?.release();
    if (dataSource.isInitialized) await dataSource.destroy();
  } catch {
    // 이미 끊긴 연결은 무시
  }
  process.exit(1);
});
