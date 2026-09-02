# 채팅 인덱스 운영 반영 안내

> 이 저장소에는 마이그레이션 도구가 없습니다. **운영 DB에 사람이 직접 실행한 DDL은
> 이 문서가 유일한 기록입니다.** 앞으로도 운영에 SQL을 직접 돌렸다면 여기에 남기세요.
>
> 현재까지 적용분: 인덱스 5개(아래) → 워터마크 컬럼 추가와 `read_receipts` 드롭
> (맨 아래 "이후 변경"). 지금 운영에 남아 있는 채팅 인덱스는 4개입니다.

## 왜 수동 반영이 필요한가

`apps/server/src/app/app.module.ts`의 TypeORM 설정은 `synchronize`를 **운영에서만 끕니다.**

```ts
synchronize: configService.get<string>('NODE_ENV') !== 'production',
```

마이그레이션 파일이 따로 없으므로, 개발 환경은 엔티티에 붙인 `@Index`가 자동 반영되지만
운영 DB에는 반영되지 않습니다. 아래 SQL을 운영 DB에 직접 실행해야 합니다.

## 배경

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

## 실행할 SQL

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

## 확인

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('chat_messages', 'read_receipts', 'chat_participants', 'chat_rooms')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

당시에는 5개 행이 나왔습니다. 지금은 아래 이유로 **4개 행**이 정상입니다.

## 이후 변경 (읽음 워터마크 전환, 2026-09-02)

읽음 처리가 `chat_participants.lastReadMessageId` 워터마크로 바뀌면서
`read_receipts` 테이블을 드롭했습니다. `idx_read_receipts_message`도 함께 사라졌고,
남은 인덱스는 4개입니다.

운영에 실제로 실행한 SQL은 아래 순서 그대로입니다.

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
