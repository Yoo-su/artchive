# Book Module (`features/book`)

도서 **마스터 데이터**(`Book` 엔티티)와 외부 도서 API 연동을 담당합니다.

> 중고책 판매글은 이 모듈이 아니라 [`used-book-sale`](../used-book-sale/README.md)에 있습니다.

## 1. 폴더 구조

```
book/
├── book.module.ts
├── controllers/
│   ├── book.controller.ts
│   └── book.controller.spec.ts
├── services/
│   ├── book.service.ts (+ spec)          # 도서 마스터 조회·동기화·통계
│   └── aladin-book-search.service.ts     # 알라딘 Open API 연동
├── entities/book.entity.ts               # isbn을 PK로 사용
├── dtos/book-info.dto.ts
├── pipes/book-resolve.pipe.ts            # ISBN → Book 보장 파이프
└── interceptors/book-view-count.interceptor.ts
```

## 2. API 엔드포인트

| 메서드 | 경로 (`/book/...`) | 인증 | 설명 |
|---|---|:---:|---|
| GET | `/popular` | ❌ | 조회수 기반 인기 도서 |
| GET | `/search` | ❌ | DB에 적재된 도서 검색 |
| GET | `/external/list` | ❌ | 알라딘 도서 목록 검색 (프록시) |
| GET | `/external/detail` | ❌ | 알라딘 도서 상세 조회 (프록시) |
| POST | `/:isbn/view` | ❌ | 도서 조회수 기록 |
| GET | `/:isbn/stats` | ❌ | 해당 도서의 독서 기록·위시리스트 통계 |

## 3. 엔티티 — `Book` (`isbn` PK)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `isbn` | `string` | Primary Key |
| `title`, `author`, `publisher` | `string` | 서지 정보 |
| `discount` | `string` | 가격 정보 (기본 `''`) |
| `description` | `text` | 소개 |
| `image` | `string` | 표지 URL |
| `viewCount` | `number` | 조회수 (인기 도서 산정) |
| `createdAt` / `updatedAt` | `timestamptz` | |

ISBN을 PK로 쓰기 때문에 리뷰·독서 기록·판매글·위시리스트가 모두 자연스럽게 같은 도서를 참조합니다.

## 4. 핵심 로직

### `resolveBook(isbn)` — 도서 지연 동기화

북적에는 사전 적재된 전체 도서 카탈로그가 없습니다. 사용자가 처음 다루는 도서는 **그 시점에** 마스터 레코드를 만듭니다.

```
resolveBook(isbn)
  │
  ├─ DB에 있으면 → 그대로 반환
  │
  └─ 없으면 → 알라딘 API 조회 → Book 생성 → 반환
```

동시 요청에는 **Request Collapsing**을 적용해 같은 ISBN에 대한 외부 API 호출을 한 번으로 합칩니다. 인기 도서에 요청이 몰릴 때 알라딘 호출이 중복되지 않습니다.

### `BookResolvePipe`

컨트롤러 파라미터 단계에서 `resolveBook`을 호출해, **서비스 레이어에 도달했을 때는 항상 해당 도서가 DB에 존재함**을 보장합니다.

- Body의 `isbn` 필드 (또는 위시리스트의 `type: "BOOK"` + `id`)
- Param의 ISBN 문자열

판매글 생성(`POST /book/sale`), 위시리스트 추가 등에서 사용합니다. 덕분에 각 서비스가 "책이 없으면 만들기" 분기를 반복 구현하지 않습니다.

### 조회수

`BookViewCountInterceptor`(공용 `BaseViewCountInterceptor` 확장)가 중복 요청을 걸러 `viewCount`를 올립니다. 이 값이 `findPopularBooks`의 기준입니다.

### 알라딘 연동 (`AladinBookSearchService`)

| 메서드 | 알라딘 API |
|---|---|
| `search` / `searchFormatted` | `ItemSearch.aspx` |
| `searchDetail` / `searchDetailFormatted` | `ItemLookUp.aspx` |

`ALADIN_TTB_KEY`가 필요합니다. `*Formatted` 계열은 클라이언트에 바로 내려줄 형태로, 나머지는 `Book` 엔티티 생성용으로 씁니다. 표지 이미지 고화질 변환은 `@bookjeok/core`의 `formatAladinCoverImage`가 담당합니다.

## 5. 다른 모듈에서의 사용

`BookService`와 `BookResolvePipe`는 `exports`되어 `used-book-sale`, `review`, `reading-log`, `wishlist`가 사용합니다. 도서 마스터 데이터를 만드는 경로는 **이 모듈 하나로 유지**하세요.

## 6. 관련

- 웹: [`features/book`](../../../../web/src/features/book/README.md)
- AI 요약: [`features/llm`](../llm/README.md) · AI 추천: [`features/search`](../search/README.md)
- 인기 검색어: [`features/search-keyword`](../search-keyword/README.md)
