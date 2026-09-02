# 채팅 인덱스 운영 반영 안내

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

5개 행이 나오면 정상입니다.

## 이후 변경 (읽음 워터마크 전환)

읽음 처리는 이후 `chat_participants.lastReadMessageId` 워터마크로 바뀌었습니다.
`read_receipts` 테이블과 `idx_read_receipts_message` 인덱스는 관찰 기간이 끝나면
테이블을 드롭하면서 함께 사라집니다. 절차와 남은 단계는
`docs/chat-read-watermark-plan.md`를 보세요.

그 시점 이후 위 "확인" 쿼리는 `read_receipts` 행이 빠져 **4개 행**이 정상입니다.
