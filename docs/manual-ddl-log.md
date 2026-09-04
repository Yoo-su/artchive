# 운영 DDL 수동 적용 이력

**운영 DB(Supabase)에 사람이 직접 실행한 DDL의 유일한 기록입니다.**
운영에 SQL을 직접 돌렸다면 반드시 여기에 남기세요. 안 남기면 다음 사람은
스키마가 왜 그 모양인지 알아낼 방법이 없습니다.

## 왜 수동 반영인가

`apps/server/src/app/app.module.ts`의 TypeORM 설정은 `synchronize`를 **운영에서만 끕니다.**

```ts
synchronize: configService.get<string>('NODE_ENV') !== 'production',
```

마이그레이션 도구도, `migrations/` 디렉터리도, TypeORM CLI 설정도 없습니다.
그래서 개발 환경은 엔티티 변경이 자동 반영되지만 **운영은 사람이 SQL을 직접 돌려야 합니다.**

### 운영에 나갈 DDL을 추측하지 않고 뽑는 방법

1. 로컬 DB 스키마를 다른 DB로 복제
2. 그 사본을 "운영과 같은 형태"로 되돌림 (이번 변경으로 생길 것들을 제거)
3. 그 사본을 향해 `dataSource.driver.createSchemaBuilder().log()` 실행
4. 나온 `upQueries`가 곧 운영에 필요한 DDL 전부

워터마크 전환 때 실제로 쓴 방법입니다. "이것 말고는 없다"를 추측이 아니라
증명할 수 있습니다.

이 절차는 `apps/server/scripts/derive-ddl.ts`로 실행할 수 있습니다.

```bash
DDL_TARGET_DATABASE_URL=postgres://user:pass@localhost:5432/bookjeok_ddl   pnpm --filter @bookjeok/server exec ts-node -r tsconfig-paths/register scripts/derive-ddl.ts
```

## 적용 이력

| 날짜 | 내용 | 관련 커밋 |
| --- | --- | --- |
| 2026-09-02 | 채팅 테이블 인덱스 5개 추가 | `e0eed214` |
| 2026-09-02 | 읽음 워터마크 컬럼 추가·백필, `read_receipts` 드롭 | `778ef588` |
| (미적용) | 거래 완료(`trade_completions`) 도입, `trade_reviews` 재구성 | 아래 3번 |

현재 운영에 남아 있는 채팅 인덱스는 **4개**입니다
(`idx_read_receipts_message`는 테이블과 함께 사라졌습니다).

---

## 1. 채팅 테이블 인덱스 5개 (2026-09-02)

### 배경

채팅 테이블에는 인덱스가 하나도 없었습니다. PostgreSQL은 외래 키 컬럼에 인덱스를
자동으로 만들지 않으므로 `chatRoomId`, `senderId`, `messageId` 모두 인덱스가 없는 상태였고,
아래 쿼리들이 전부 테이블 전체를 훑고 있었습니다.

| 쿼리 | 위치 |
| --- | --- |
| 방별 마지막 메시지 (`DISTINCT ON`) | `ChatService.getChatRooms` |
| 방별 안 읽음 개수 집계 | `ChatService.getChatRooms`, `markMessagesAsRead` |
| 메시지 커서 페이지네이션 | `ChatService.getChatMessages` |
| 메시지 전송 시 상대방 참여 상태 확인 | `ChatService.saveMessage` |
| 판매글 단위 방 조회 | `ChatService.resolveChatRoom`, `notifyOtherBuyersTrading` |

`chat_participants`와 `read_receipts`에는 `@Unique`가 만든 인덱스가 있지만
각각 `(userId, chatRoomId)`, `(userId, messageId)` 순서라 **선행 컬럼이 userId**입니다.
방 기준·메시지 기준 조회는 그 인덱스를 쓸 수 없어 아래 인덱스를 따로 추가합니다.

> 아래에 나오는 `read_receipts`는 지금은 없는 테이블입니다. 당시 기록 그대로 둡니다.
> 읽음 처리가 워터마크로 바뀌면서 테이블과 인덱스를 함께 드롭했습니다(아래 "이후 변경").

### 실행한 SQL

인덱스 이름은 엔티티의 `@Index('...')`에 지정한 이름과 같습니다.
이름과 컬럼이 일치하므로 개발 환경의 `synchronize`가 이 인덱스를 다시 만들거나 지우지 않습니다.

```sql
-- 서비스 중단 없이 만들기 위해 CONCURRENTLY를 사용합니다.
-- CONCURRENTLY는 트랜잭션 블록 안에서 실행할 수 없으니 한 줄씩 실행하세요.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_messages_room_created_at"
  ON "chat_messages" ("chatRoomId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_messages_room_sender"
  ON "chat_messages" ("chatRoomId", "senderId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_read_receipts_message"
  ON "read_receipts" ("messageId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_participants_room"
  ON "chat_participants" ("chatRoomId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_rooms_used_book_sale"
  ON "chat_rooms" ("usedBookSaleId");
```

`CONCURRENTLY`가 실패하면 인덱스가 `INVALID` 상태로 남습니다.
아래로 확인하고, 무효한 인덱스는 지운 뒤 다시 실행하세요.

```sql
SELECT c.relname, i.indisvalid
FROM pg_class c
JOIN pg_index i ON i.indexrelid = c.oid
WHERE c.relname LIKE 'idx_chat%' OR c.relname LIKE 'idx_read_receipts%';
```

### 확인

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('chat_messages', 'read_receipts', 'chat_participants', 'chat_rooms')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

당시에는 5개 행이 나왔습니다. 지금은 아래 이유로 **4개 행**이 정상입니다.

## 2. 읽음 워터마크 전환 (2026-09-02)

읽음 처리가 `chat_participants.lastReadMessageId` 워터마크로 바뀌면서
`read_receipts` 테이블을 드롭했습니다. `idx_read_receipts_message`도 함께 사라졌고,
남은 인덱스는 4개입니다.

### 실행한 SQL

아래 순서 그대로 실행했습니다.

```sql
-- 1) 컬럼 추가 (코드 배포 전. 구버전 코드는 이 컬럼을 모르므로 무해)
ALTER TABLE chat_participants
  ADD COLUMN IF NOT EXISTS "lastReadMessageId" integer;

-- 2) 백필: 영수증의 방별 최대 메시지 ID가 곧 워터마크
--    GREATEST를 쓰면 여러 번 돌려도 워터마크가 뒤로 가지 않습니다.
UPDATE chat_participants cp
SET "lastReadMessageId" = GREATEST(COALESCE(cp."lastReadMessageId", 0), sub.watermark)
FROM (
  SELECT r."userId", m."chatRoomId", MAX(m.id) AS watermark
  FROM read_receipts r
  JOIN chat_messages m ON m.id = r."messageId"
  GROUP BY r."userId", m."chatRoomId"
) sub
WHERE cp."userId" = sub."userId" AND cp."chatRoomId" = sub."chatRoomId";

-- 3) 코드 배포 후, 관찰을 거쳐 정리
DROP TABLE read_receipts;
```

백필 전에 "읽음 집합에 구멍이 없는지"를 먼저 확인했고(운영 결과 0),
백필 후에는 두 방식의 안 읽음 개수가 모든 참여자에 대해 일치하는지 검증했습니다
(결과 0). 검증 쿼리는 `perf(server): 읽음 처리를 참여자 워터마크로 전환` 커밋을
되짚을 일이 있을 때 그 시점 문서(`docs/chat-read-watermark-plan.md`, 전환 완료 후 삭제)
이력에서 찾을 수 있습니다.

워터마크는 인덱스를 두지 않았습니다. 이 컬럼은 항상 `(userId, chatRoomId)`로 찾은
행에서 읽고 쓰기만 하고 — 그 조합은 `@Unique`가 만든 인덱스가 커버합니다 —
조건으로 거는 쪽은 언제나 `chat_messages.id`입니다.

설계 설명은 `apps/server/src/features/chat/README.md`의 "4. 읽음 처리: 워터마크"에 있습니다.

---

## 3. 거래 완료(`trade_completions`) 도입과 `trade_reviews` 재구성 (미적용)

> **명명 규칙**: 운영 스키마는 손으로 붙인 이름(`IDX_{테이블}_{컬럼}`, `UQ_`, `PK_`,
> `FK_`, 컬럼은 camelCase 유지)을 씁니다. 아래 DDL도 그 규칙을 따르고, 인덱스·유니크
> 이름은 엔티티 데코레이터에도 같은 값으로 박아두어 개발(`synchronize`)과 어긋나지
> 않게 했습니다. PK·FK 이름은 TypeORM 데코레이터로 지정할 수 없어 개발 환경과는
> 다를 수 있습니다(기존 테이블도 이미 그런 상태입니다).
>
> **아직 운영에 적용하지 않았습니다.** 아래 SQL은 엔티티 정의에서 직접 옮겨 적은
> 것으로, 위의 `derive-ddl.ts`로 검증하지 않았습니다(작성 시점에 로컬 Postgres를
> 띄울 수 없었음). **실행 전에 반드시 스크립트로 한 번 뽑아 대조하세요.**
> 특히 TypeORM이 만드는 인덱스·제약 이름은 해시 기반이라 손으로 맞히기 어렵습니다.

### 배경

거래 후기가 `orders`에 1:1로 매달려 있어서, 결제를 거치지 않는 직거래에서는
후기를 남길 수 없었습니다. 결제(`Order`)는 거래의 한 가지 수단일 뿐인데 후기와
신뢰 지표가 거기에만 붙어 있던 게 원인입니다.

"거래가 성사됐다"는 사실을 `trade_completions`로 분리하고, 후기는 그쪽에 붙입니다.
결제 거래도 구매확정 시점에 완료 기록을 하나 만들므로 두 경로가 하나로 합쳐집니다.

### 사전 확인

`trade_reviews`와 `orders`가 **비어 있어야** 아래 절차를 그대로 쓸 수 있습니다
(결제 기능이 봉인되어 있어 운영 데이터가 없는 상태를 전제로 합니다).

```sql
SELECT 'trade_reviews' AS table_name, COUNT(*) AS rows FROM trade_reviews
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;
```

둘 다 0이 아니면 `trade_reviews`를 드롭하지 말고 마이그레이션 계획을 다시 세우세요.

> **개발 DB 주의.** 개발 환경은 `synchronize: true`라 엔티티의
> `UQ_trade_completions_saleId`를 자동으로 만들려 합니다. 판매글당 완료 기록이
> 2건 이상 쌓여 있으면 제약 생성이 실패해 서버가 뜨지 않습니다. 아래로 확인하고
> 중복이 있으면 오래된 행을 지운 뒤 띄우세요.
>
> ```sql
> SELECT "saleId", COUNT(*) FROM trade_completions GROUP BY 1 HAVING COUNT(*) > 1;
> ```

### 적용 체크리스트

1. **위 사전 확인 쿼리를 돌려 두 값이 모두 0인지 확인한다.**
2. `derive-ddl.ts`로 DDL을 뽑아 아래 SQL과 대조하고, 차이가 있으면 **스크립트 결과를 따른다.**
3. 0단계(알림 enum 값 추가)를 먼저 실행한다.
4. 1단계 SQL을 한 트랜잭션으로 실행한다.
5. 서버를 배포한다. (코드가 먼저 나가면 `trade_completions`가 없어 500이 난다 —
   반드시 **DDL → 배포** 순서)
6. 판매글 하나로 직거래 예약 → 완료 → 후기까지 한 바퀴 돌려본다.
7. 이 문서의 이력 표에서 이 항목의 날짜와 커밋을 채운다.

#### 0단계 — 알림 enum 값 추가 (트랜잭션 밖에서 먼저)

`notifications.type`은 Postgres enum이라 값을 늘리려면 `ALTER TYPE`이 필요합니다.
`ADD VALUE`는 추가한 값을 **같은 트랜잭션 안에서 쓸 수 없으므로** 아래 두 줄은
본 트랜잭션과 분리해 먼저 실행합니다.

```sql
ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'TRADE_RESERVED';
ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'TRADE_COMPLETED';
```

> **타입 이름이 테이블 이름과 다릅니다.** 테이블은 `notifications`(복수)인데 enum은
> `notification_type_enum`(단수)입니다. Postgres는 테이블 이름을 바꿔도 enum 타입
> 이름을 따라 바꾸지 않기 때문입니다. 같은 흔적으로 `used_book_posts_status_enum`이
> 쓰이지 않는 채 남아 있습니다(`used_book_posts` → `used_book_sales` 개명).
>
> **그래서 enum 이름은 추측하지 말고 항상 조회해서 확인하세요.**

```sql
SELECT n.nspname AS schema,
       t.typname AS enum_type,
       string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS values
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY 1, 2
ORDER BY 2;
```

#### 1단계 — 본 DDL

```sql
BEGIN;

-- 1) 예약 상대. 예약중은 다른 구매희망자에게 보내는 신호이므로
--    "누구와 예약했는지"가 남아야 다른 채팅방에 안내를 띄울 수 있다.
ALTER TABLE used_book_sales
  ADD COLUMN IF NOT EXISTS "reservedForUserId" integer;

ALTER TABLE used_book_sales
  ADD CONSTRAINT "FK_used_book_sales_reservedForUserId"
  FOREIGN KEY ("reservedForUserId") REFERENCES users(id) ON DELETE SET NULL;

-- 2) 거래 완료 기록
--    새로 만드는 테이블이라 TypeORM 규칙({테이블}_{컬럼}_enum)과 이름이 일치한다.
--    개명 이력이 있는 기존 테이블과 달리 여기서는 추측이 아니다.
CREATE TYPE "trade_completions_method_enum" AS ENUM ('DIRECT', 'DELIVERY');

CREATE TABLE trade_completions (
  id            SERIAL,
  "saleId"      integer NOT NULL REFERENCES used_book_sales(id) ON DELETE CASCADE,
  "sellerId"    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "buyerId"     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "chatRoomId"  integer NULL REFERENCES chat_rooms(id) ON DELETE SET NULL,
  method        "trade_completions_method_enum" NOT NULL DEFAULT 'DIRECT',
  "orderId"     varchar NULL,
  "completedAt" timestamptz NOT NULL,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_trade_completions_id" PRIMARY KEY (id),
  CONSTRAINT "UQ_trade_completions_orderId" UNIQUE ("orderId"),
  CONSTRAINT "UQ_trade_completions_saleId" UNIQUE ("saleId")
);

-- 신뢰 지표는 사용자별 완료 건수를 세므로 두 방향 모두 인덱스가 필요하다.
CREATE INDEX "IDX_trade_completions_sellerId_completedAt"
  ON trade_completions ("sellerId", "completedAt");
CREATE INDEX "IDX_trade_completions_buyerId_completedAt"
  ON trade_completions ("buyerId", "completedAt");

-- 3) 후기를 주문이 아니라 완료 기록에 매단다.
--    비어 있는 테이블이므로 재생성이 가장 깔끔하다.
DROP TABLE trade_reviews;

CREATE TABLE trade_reviews (
  id             SERIAL,
  "completionId" integer NOT NULL REFERENCES trade_completions(id) ON DELETE CASCADE,
  "reviewerId"   integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "targetUserId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags           text NOT NULL,
  content        text NULL,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_trade_reviews_id" PRIMARY KEY (id),
  -- 한 거래당 양쪽이 각각 한 건씩
  CONSTRAINT "UQ_trade_reviews_completionId_reviewerId"
    UNIQUE ("completionId", "reviewerId")
);

-- 드롭 전과 같은 이름으로 다시 만든다.
CREATE INDEX "IDX_trade_reviews_targetUserId_createdAt"
  ON trade_reviews ("targetUserId", "createdAt");

COMMIT;
```

### 되돌리기

```sql
BEGIN;
DROP TABLE IF EXISTS trade_reviews;
DROP TABLE IF EXISTS trade_completions;
DROP TYPE IF EXISTS "trade_completions_method_enum";
ALTER TABLE used_book_sales DROP CONSTRAINT IF EXISTS "FK_used_book_sales_reservedForUserId";
ALTER TABLE used_book_sales DROP COLUMN IF EXISTS "reservedForUserId";
COMMIT;
```

되돌리면 후기 데이터가 사라집니다. 배포 후 후기가 쌓이기 시작했다면
이 스크립트를 그대로 쓰지 마세요.

`notifications_type_enum`에 추가한 값은 되돌리지 않습니다. Postgres는 enum 값
삭제를 지원하지 않고, 남아 있어도 쓰지 않으면 해가 없습니다.

설계 설명은 `apps/server/src/features/trade/README.md`에 있습니다.
