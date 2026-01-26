# Notification Module (`features/notification`)

`NotificationModule`은 사용자 알림 시스템을 제공합니다. 리뷰 리액션, 댓글 작성/좋아요 등의 이벤트 발생 시 실시간 알림을 생성하고 조회하는 기능을 담당합니다.

## 1. 주요 파일 및 역할

- **`notification.controller.ts`**: `/notifications` 경로의 API 엔드포인트를 정의합니다.
- **`notification.service.ts`**: 알림 생성, 조회, 읽음 처리 등 비즈니스 로직을 처리합니다.
- **`notification.gateway.ts`**: Socket.IO를 이용해 실시간 알림 이벤트를 클라이언트로 전송합니다.
- **`entities/notification.entity.ts`**: 알림 정보를 저장하는 TypeORM 엔티티입니다.
- **`dto/`**: API 요청/응답에 사용되는 DTO 파일들입니다.

## 2. API 엔드포인트

| HTTP Method | 경로 (`/notifications/...`) | 설명                                  | 인증 필요 |
| :---------- | :-------------------------- | :------------------------------------ | :-------- |
| `GET`       | `/`                         | 내 알림 목록 조회 (커서 페이지네이션) | ✅        |
| `GET`       | `/unread-count`             | 안 읽은 알림 수 조회                  | ✅        |
| `PATCH`     | `/read-all`                 | 모든 알림 읽음 처리                   | ✅        |
| `PATCH`     | `/:id/read`                 | 특정 알림 읽음 처리                   | ✅        |

## 3. 엔티티 스키마

### `Notification`

| 컬럼명        | 타입      | 설명                                                      |
| :------------ | :-------- | :-------------------------------------------------------- |
| `id`          | `number`  | 알림 ID (PK)                                              |
| `recipientId` | `number`  | 수신자 ID                                                 |
| `actorId`     | `number`  | 알림 유발자 ID                                            |
| `type`        | `enum`    | 알림 유형 (REVIEW_REACTION, REVIEW_COMMENT, COMMENT_LIKE) |
| `metadata`    | `jsonb`   | 알림 구성에 필요한 동적 데이터 (책 제목, 리뷰 제목 등)    |
| `isRead`      | `boolean` | 읽음 여부                                                 |
| `createdAt`   | `Date`    | 생성일                                                    |

## 4. 실시간 알림 (Socket.IO)

- **Namespace**: `/notification`
- **Event**: `newNotification`
- **Payload**: `Notification` 엔티티 객체

클라이언트는 소켓 연결 후 `newNotification` 이벤트를 리스닝하여 실시간 알림을 수신할 수 있습니다.
