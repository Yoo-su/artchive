# Reading-Log Module (`features/reading-log`)

`ReadingLogModule`은 사용자의 독서 기록을 관리하는 모듈입니다. 날짜별 독서 기록 생성, 조회, 수정, 삭제 및 통계 기능을 제공합니다.

## 1. 주요 파일 및 역할

- **`reading-log.controller.ts`**: `/reading-logs` 경로의 API 엔드포인트를 정의합니다.
- **`reading-log.service.ts`**: 독서 기록 관련 비즈니스 로직을 처리합니다.
  - `create`: 새로운 독서 기록을 생성합니다.
  - `findAllByMonth`: 특정 연/월의 독서 기록을 조회합니다.
  - `findAllInfinite`: 독서 기록을 커서 기반 페이지네이션으로 조회합니다.
  - `getStats`: 월별/연간 독서 통계를 조회합니다.
  - `getSettings`: 독서 기록 공개 설정을 조회합니다.
  - `updateSettings`: 독서 기록 공개 설정을 수정합니다.
  - `update`: 독서 기록을 수정합니다.
  - `remove`: 독서 기록을 삭제합니다.
- **`entities/reading-log.entity.ts`**: 독서 기록 정보를 담는 TypeORM 엔티티입니다.

## 2. API 엔드포인트

| HTTP Method | 경로 (`/reading-logs/...`) | 설명                              | 인증 필요 |
| :---------- | :------------------------- | :-------------------------------- | :-------- |
| `GET`       | `/`                        | 독서 기록 목록 조회 (무한 스크롤) | ✅        |
| `POST`      | `/`                        | 독서 기록 생성                    | ✅        |
| `PATCH`     | `/:id`                     | 독서 기록 수정                    | ✅        |
| `DELETE`    | `/:id`                     | 독서 기록 삭제                    | ✅        |
| `GET`       | `/monthly`                 | 월별 독서 기록 조회               | ✅        |
| `GET`       | `/stats`                   | 독서 통계 조회                    | ✅        |
| `GET`       | `/settings`                | 공개 설정 조회                    | ✅        |
| `PUT`       | `/settings`                | 공개 설정 수정                    | ✅        |

## 3. 엔티티 스키마

### `ReadingLog`

| 컬럼명       | 타입     | 설명                   |
| :----------- | :------- | :--------------------- |
| `id`         | `uuid`   | 기록 고유 ID (PK)      |
| `userId`     | `number` | 사용자 ID (FK)         |
| `bookIsbn`   | `string` | 도서 ISBN              |
| `bookTitle`  | `string` | 도서 제목              |
| `bookImage`  | `string` | 도서 표지 URL          |
| `bookAuthor` | `string` | 도서 저자              |
| `date`       | `date`   | 독서 날짜 (YYYY-MM-DD) |
| `memo`       | `string` | 메모 (최대 100자)      |
| `createdAt`  | `Date`   | 생성일                 |
| `updatedAt`  | `Date`   | 수정일                 |

## 4. 핵심 기능

### 커서 기반 페이지네이션

`findAllInfinite` 메서드는 커서 기반 페이지네이션을 사용하여 무한 스크롤을 지원합니다:

- `cursorId`: 마지막으로 로드된 기록의 ID
- 날짜 기준 내림차순 정렬 (같은 날짜면 생성일 기준)
- `hasNextPage` 확인을 위해 limit+1개 조회

### 독서 통계

`getStats` 메서드는 두 가지 통계를 제공합니다:

- `monthlyCount`: 이번 달 읽은 책 수
- `yearlyCount`: 올해 읽은 책 수

### 공개 설정

사용자는 자신의 독서 기록을 다른 사용자에게 공개할지 설정할 수 있습니다. 공개된 경우, 해당 사용자의 프로필 페이지에서 최근 3개월 독서 기록을 확인할 수 있습니다.
