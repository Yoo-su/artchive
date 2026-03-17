# Comment Module (`features/comment`)

`CommentModule`은 도서와 리뷰에 대한 댓글 기능을 제공합니다. 댓글 CRUD 및 좋아요 기능을 지원합니다.

## 1. 주요 파일 및 역할

- **`comment.controller.ts`**: `/comments` 경로의 API 엔드포인트를 정의합니다.
- **`comment.service.ts`**: 댓글 관련 비즈니스 로직을 처리합니다.
  - `getComments`: 특정 대상(도서/리뷰)의 댓글 목록을 페이지네이션으로 조회합니다.
  - `getMyComments`: 내가 작성한 댓글 목록을 조회합니다.
  - `createComment`: 새 댓글을 생성합니다.
  - `updateComment`: 댓글을 수정합니다 (작성자만 가능).
  - `deleteComment`: 댓글을 삭제합니다 (작성자만 가능).
  - `toggleLike`: 댓글 좋아요를 토글합니다.
- **`entities/comment.entity.ts`**: 댓글 정보를 담는 TypeORM 엔티티입니다.
- **`entities/comment-like.entity.ts`**: 댓글 좋아요 정보를 담는 중간 테이블 엔티티입니다.

## 2. API 엔드포인트

| HTTP Method | 경로 (`/comments/...`) | 설명                                       | 인증 필요 |
| :---------- | :--------------------- | :----------------------------------------- | :-------- |
| `GET`       | `/`                    | 댓글 목록 조회 (targetType, targetId 필터) | ❌        |
| `POST`      | `/`                    | 댓글 작성                                  | ✅        |
| `PATCH`     | `/:id`                 | 댓글 수정                                  | ✅        |
| `DELETE`    | `/:id`                 | 댓글 삭제                                  | ✅        |
| `POST`      | `/:id/like`            | 댓글 좋아요 토글                           | ✅        |
| `GET`       | `/my`                  | 내가 작성한 댓글 목록                      | ✅        |

## 3. 엔티티 스키마

### `Comment`

| 컬럼명       | 타입                | 설명                         |
| :----------- | :------------------ | :--------------------------- |
| `id`         | `number`            | 댓글 고유 ID (PK)            |
| `content`    | `text`              | 댓글 내용                    |
| `targetType` | `enum`              | 대상 타입 (`BOOK`, `REVIEW`) |
| `targetId`   | `string`            | 대상 ID (ISBN 또는 리뷰 ID)  |
| `userId`     | `number` (nullable) | 작성자 ID (탈퇴 시 null)     |
| `likeCount`  | `number`            | 좋아요 수 (비정규화)         |
| `createdAt`  | `Date`              | 생성일                       |
| `updatedAt`  | `Date`              | 수정일                       |

### `CommentLike`

| 컬럼명      | 타입     | 설명                |
| :---------- | :------- | :------------------ |
| `id`        | `number` | 좋아요 고유 ID (PK) |
| `commentId` | `number` | 댓글 ID (FK)        |
| `userId`    | `number` | 사용자 ID (FK)      |
| `createdAt` | `Date`   | 생성일              |

## 4. 핵심 기능

### 좋아요 토글

댓글 좋아요는 토글 방식으로 동작합니다:

1. 이미 좋아요한 경우 → 좋아요 취소 (likeCount 감소)
2. 좋아요하지 않은 경우 → 좋아요 추가 (likeCount 증가)

`likeCount`는 비정규화된 필드로, 매번 COUNT 쿼리 없이 빠르게 좋아요 수를 조회할 수 있습니다.
