# 채팅 읽음 처리 워터마크 전환 계획

> 이 문서는 **운영 절차서**입니다. 코드 전환은 끝났고, 아래 SQL 실행과
> 관찰만 남았습니다. `read_receipts`를 드롭하고 나면 삭제하세요.
> (설계 설명은 이미 `apps/server/src/features/chat/README.md`로 옮겼습니다.)

## 1. 목표와 배경

읽음 처리가 **메시지 1건당 `read_receipts` 1행**을 쌓는 구조입니다.
이를 `chat_participants.lastReadMessageId` **워터마크 한 칸**으로 바꿉니다.

**동기는 성능이 아니라 구조입니다.** 운영 `read_receipts`는 현재 285행이라
지금 당장 느리지 않습니다(직전 작업에서 인덱스 + 벌크 INSERT로 이미 정리됨).
행이 메시지 수에 비례해 무한히 늘고 읽을 때마다 그만큼 INSERT가 나가는 구조
자체가 문제이고, **데이터가 적은 지금이 옮기기 가장 싼 시점**이라 진행합니다.

## 2. 현재 상태

- **코드 전환 완료** (아래 "3단계"). 서버는 워터마크만 읽고 씁니다.
  `ReadReceipt` 엔티티는 코드에서 제거했지만, 운영 `synchronize`가 꺼져 있으므로
  **운영의 `read_receipts` 테이블은 그대로 남습니다.** 롤백 안전장치가 유지됩니다.
- **사전 점검(4장) 운영 결과 0 확인** — 읽음 집합에 구멍 없음.
- 남은 일: 7-1 → 7-2 → 7-3 실행, 코드 배포, 관찰, 7-4 드롭. (8장 순서 참고)

## 2-1. 그 전까지 된 것 (develop)

```
59cd4455 fix(web): 앱 복귀 시 채팅방 메시지가 비는 문제 해결
f933fa98 fix(web): 이미지 라이트박스 로딩 중 레이아웃 시프트 제거
c499a050 feat(web): 채팅 사용자 경험 및 렌더링 성능 개선
e711ef3e refactor(core, react-query): 채팅 이벤트 타입 추가 및 방 목록 쿼리 select 지원
28c61796 fix(server): 타이핑 이벤트에 roomId 포함 및 읽음 상태 브로드캐스트 추가
e0eed214 perf(server): 채팅 테이블 인덱스 추가 및 읽음 처리 쿼리 개선
```

각 커밋 본문에 "왜"가 적혀 있습니다. `git show <sha>`로 읽으세요.
채팅 아키텍처와 지켜야 할 규칙은 `apps/web/src/features/chat/README.md`에 있습니다.

운영 DB에는 `docs/chat-index-migration.md`의 인덱스 5개가 **이미 반영 완료**입니다.

## 3. 반드시 알아야 할 환경 사실

- **마이그레이션 도구가 없습니다.** `migrations/` 디렉터리도, TypeORM CLI 설정도 없습니다.
- `synchronize`는 **운영에서만 꺼져 있습니다**
  (`apps/server/src/app/app.module.ts`: `NODE_ENV !== 'production'`).
  즉 개발은 엔티티 변경이 자동 반영되고, **운영은 SQL을 사람이 직접 돌려야 합니다.**
- 운영 DB는 **Supabase**입니다. 에이전트는 접근할 수 없습니다. SQL은 사용자가 실행합니다.
- 로컬 개발 DB는 docker compose로 뜹니다: `pnpm db:up`
  (`postgres/postgres`, db명 `bookjeok`, 5432).
- **운영에 나갈 DDL을 정확히 뽑는 방법** (이번에 실제로 쓴 방법, 권장):
  1. 로컬 DB 스키마를 다른 DB로 복제 (`pg_dump --schema-only` → 새 DB에 적용)
  2. 그 사본을 "운영과 같은 형태"로 되돌림 (이번 변경으로 생길 것들을 제거)
  3. 그 사본을 향해 `dataSource.driver.createSchemaBuilder().log()` 실행
  4. 나온 `upQueries`가 곧 운영에 필요한 DDL 전부
  - 이렇게 하면 "인덱스 5개 외에 아무것도 없다"를 추측이 아니라 **증명**할 수 있습니다.

## 4. 사전 점검 — 백필 전에 반드시 (사용자 실행)

워터마크는 "읽은 메시지 **집합**"을 "여기까지 읽음" 한 칸으로 접습니다.
집합에 **구멍**이 있으면 그 구멍이 읽음으로 덮여, 안 읽은 메시지가 사라집니다.

현재 `markMessagesAsRead`는 방 전체를 한 번에 처리하므로 구멍이 없어야 정상입니다.
운영에서 확인하세요.

```sql
-- 결과가 0이면 안전. 0이 아니면 백필하지 말고 먼저 원인을 파악할 것.
SELECT COUNT(*) AS rows_with_gaps
FROM (
  SELECT r."userId",
         m."chatRoomId",
         COUNT(*) AS receipt_count,
         (SELECT COUNT(*)
            FROM chat_messages m2
           WHERE m2."chatRoomId" = m."chatRoomId"
             AND m2.id <= MAX(m.id)
             AND (m2."senderId" IS NULL OR m2."senderId" <> r."userId")
         ) AS expected_count
  FROM read_receipts r
  JOIN chat_messages m ON m.id = r."messageId"
  GROUP BY r."userId", m."chatRoomId"
) t
WHERE receipt_count <> expected_count;
```

> **완료**: 로컬(dev)·운영 모두 `0` 확인. 구멍 없음.

## 5. 무엇이 바뀌었나 (완료)

### 서버

| 파일 | 변경 |
| --- | --- |
| `chat/entities/chat-participant.entity.ts` | `lastReadMessageId: number \| null` 추가 (인덱스 없음: 항상 `(userId, chatRoomId)`로 찾은 행에서 읽고 쓰기만 함) |
| `chat/services/chat.service.ts` | `markMessagesAsRead` → MAX 조회 + UPDATE 한 번. `getOpponentLastReadMessageId` → 참여자 행에서 읽기. 안 읽음 집계 → `message.id > COALESCE(participant.lastReadMessageId, 0)` |
| `chat/entities/read-receipt.entity.ts` | 삭제 |
| `chat/entities/chat-message.entity.ts` | `readReceipts` 관계 제거 |
| `chat/chat.module.ts` | `ReadReceipt` 등록 제거 |
| `chat/listeners/chat-cleanup.listener.ts` | 영수증 삭제 제거 (참여자 행 비활성화로 함께 정리됨) |
| `user/entities/user.entity.ts`, `user/README.md` | `readReceipts` 관계 제거 |
| `chat/services/chat.service.spec.ts` | 워터마크 테스트 추가 |
| `chat/README.md` | "4. 읽음 처리: 워터마크" 절 추가 |

### 클라이언트 / packages: **0개**

소켓 계약(`messagesRead { roomId, userId, lastReadMessageId }`,
메시지 첫 페이지의 `opponentLastReadMessageId`)이 그대로라 손댄 곳이 없습니다.

> **이 계약을 바꾸지 마세요.** 바꾸는 순간 서버 내부 교체가 전면 변경으로 커집니다.

### 실제 Postgres로 검증한 것

로컬 DB에 스키마를 만들어 다음을 확인했습니다(검증용 스펙은 커밋하지 않음).

- 3장 4번 방법(`createSchemaBuilder().log()`)으로 뽑은 운영 DDL이
  **`ALTER TABLE "chat_participants" ADD "lastReadMessageId" integer` 한 줄뿐**.
- 4장 사전 점검 → `0`, 7-2 백필 → 워터마크 정상, 7-3 검증 → `0`.
- 백필 뒤 새 코드의 안 읽음 개수·상대 읽음 지점이 영수증 방식과 일치.
- 워터마크 전진/정체(`updated` 0/1), 내가 보낸 메시지만 추가된 경우 등 경계 동작.

## 6. 깨면 안 되는 불변식

직전 작업에서 만든 규칙들입니다. 어기면 조용히 회귀합니다.

1. **읽음 처리 경로는 하나** — `ChatRoom`이 "보이는 방에서 내가 보내지 않은 마지막
   메시지 ID"가 올라갈 때만 `useMarkRoomAsRead`로 한 번 보냅니다.
   테스트: `chat-room-read-marking.test.tsx`
2. **위젯은 닫혀도 언마운트되지 않습니다** — 안 보이는 동안 도는 작업이 없어야 합니다.
   읽음 처리 · 주문 폴링이 `isChatOpen`으로 막혀 있습니다.
   테스트: `chat-widget-persistence.test.tsx`, `chat-hidden-polling.test.tsx`
3. **메시지 캐시 페이지 순서** — `pages[0]`이 가장 오래된 페이지, 마지막이 최신.
   새 메시지는 최신 페이지 맨 앞에. 전체 정렬을 다시 넣지 마세요.
   테스트: `chat-cache-utils.test.ts`, `chat-message-utils.test.ts`
4. **방 캐시가 목록보다 뒤처지면 스스로 메꿉니다** — 소켓 상태에 기대지 않습니다.
   테스트: `chat-room-stale-cache.test.tsx`
5. 실패한 메시지는 지우지 않고 실패 상태로 남깁니다.
   테스트: `chat-message-retry.test.tsx`, `chat-image-send.test.tsx`

## 7. 운영 SQL

> 7-1 ~ 7-3은 **코드 배포 전에** 실행합니다. 백필 없이 새 코드가 뜨면
> 모든 방이 잠깐 "전부 안 읽음"으로 보입니다.

### 7-1. 컬럼 추가 (코드 배포 전)

```sql
ALTER TABLE chat_participants
  ADD COLUMN IF NOT EXISTS "lastReadMessageId" integer;
```

nullable로 둡니다. 이 시점의 구버전 코드는 이 컬럼을 모르므로 영향이 없습니다.

### 7-2. 백필

```sql
UPDATE chat_participants cp
SET "lastReadMessageId" = sub.watermark
FROM (
  SELECT r."userId", m."chatRoomId", MAX(m.id) AS watermark
  FROM read_receipts r
  JOIN chat_messages m ON m.id = r."messageId"
  GROUP BY r."userId", m."chatRoomId"
) sub
WHERE cp."userId" = sub."userId"
  AND cp."chatRoomId" = sub."chatRoomId";
```

> 로컬 리허설 완료. 285행 규모면 즉시 끝납니다.
> 영수증이 없는 참여자는 `NULL`로 남고, 코드는 `COALESCE(..., 0)`으로 다룹니다.

### 7-3. 검증 — 백필 전후 안 읽음 개수가 같아야 함

```sql
-- 결과가 0이어야 정상 (두 방식의 안 읽음 개수가 모든 참여자에 대해 일치)
SELECT COUNT(*) AS mismatched
FROM (
  SELECT cp.id,
         (SELECT COUNT(*) FROM chat_messages m
           WHERE m."chatRoomId" = cp."chatRoomId"
             AND (m."senderId" IS NULL OR m."senderId" <> cp."userId")
             AND NOT EXISTS (SELECT 1 FROM read_receipts r
                              WHERE r."messageId" = m.id AND r."userId" = cp."userId")
         ) AS old_unread,
         (SELECT COUNT(*) FROM chat_messages m
           WHERE m."chatRoomId" = cp."chatRoomId"
             AND (m."senderId" IS NULL OR m."senderId" <> cp."userId")
             AND m.id > COALESCE(cp."lastReadMessageId", 0)
         ) AS new_unread
  FROM chat_participants cp
) t
WHERE old_unread <> new_unread;
```

### 7-4. 정리 (관찰 기간 후, 별도 배포)

```sql
DROP TABLE read_receipts;
```

## 8. 롤아웃 순서

```
0) 사전 점검 (4장)           — 완료. 결과 0
1) 컬럼 추가 (7-1)          — 구버전 코드에 무해
2) 백필 (7-2) + 검증 (7-3)  — read_receipts는 그대로 둠
3) 워터마크 코드 배포        — 읽기/쓰기 모두 워터마크로 (코드 준비 완료)
4) 며칠 관찰                 — 문제 시 코드만 되돌리면 read_receipts가 살아 있어 복구 가능
5) read_receipts 드롭 (7-4) — 되돌릴 수 없음. 확신 후에만
```

**3단계까지는 `read_receipts`를 지우지 않는 것이 롤백 안전장치입니다.**

되돌릴 때 주의: 배포 이후에 읽은 기록은 `read_receipts`에 쌓이지 않습니다.
코드를 되돌리면 그 사이에 읽은 메시지가 다시 안 읽음으로 보입니다.
데이터가 깨지는 것은 아니고, 다시 읽으면 원래대로 돌아옵니다.

## 9. 관찰할 것 (4단계)

- 방 목록의 안 읽음 배지가 실제 안 읽은 메시지 수와 맞는지
- 내가 보낸 메시지의 읽음 표시가 상대가 방을 열었을 때 갱신되는지
- 배포 직후 "전부 안 읽음"으로 보이는 방이 없는지 (있으면 백필 누락 신호)

## 10. 검증 명령

```bash
cd apps/server && npx tsc --noEmit -p tsconfig.json && npx jest --silent && npx nest build
npx eslint "src/features/chat/**/*.ts"
```

이번 전환은 서버만 바뀌므로 web/packages 빌드는 돌리지 않았습니다.
다음에 web을 건드린다면 아래도 함께 돌리세요.

```bash
pnpm --filter=@bookjeok/core build && pnpm --filter=@bookjeok/react-query build
cd apps/web && npx tsc --noEmit -p tsconfig.json && npx vitest run
npx turbo build --filter=@bookjeok/web --force
```

주의할 점:

- **`next build`는 타입 체크와 별도로 ESLint를 돌립니다.** `tsc`와 테스트가
  통과해도 빌드가 실패할 수 있으니 **푸시 전에 반드시 빌드까지** 돌리세요.
  (이번 작업에서 임포트 정렬 규칙으로 실제로 한 번 실패했습니다.)
- lint 출력을 `tail`로 자르지 마세요. 에러 줄을 놓칩니다.
- `apps/server/src/features/chat/gateways/chat.gateway.spec.ts`는 **기존부터**
  CRLF 때문에 prettier lint가 100건 실패합니다. 이번 작업과 무관하니 건드리지 마세요.
