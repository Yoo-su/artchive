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

## 적용 이력

| 날짜 | 내용 | 관련 커밋 |
| --- | --- | --- |
| 2026-09-02 | 채팅 테이블 인덱스 5개 추가 | `e0eed214` |
| 2026-09-02 | 읽음 워터마크 컬럼 추가·백필, `read_receipts` 드롭 | `778ef588` |

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
