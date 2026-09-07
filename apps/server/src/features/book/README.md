# Book Module (`features/book`)

도서 **마스터 데이터**(`Book` 엔티티)와 외부 도서 API 연동을 담당합니다.

> **외부 도서 API 호출은 이 모듈이 단독으로 담당합니다.** 웹에서 공급처를 직접
> 부르지 않습니다. 알라딘 종료(2026-10-30) 대응 진행 상황은
> [docs/book-data-migration-plan.md](../../../../../docs/book-data-migration-plan.md)를 보세요.

> 중고책 판매글은 이 모듈이 아니라 [`used-book-sale`](../used-book-sale/README.md)에 있습니다.

## 1. 폴더 구조

```
book/
├── book.module.ts
├── controllers/
│   ├── book.controller.ts
│   └── book.controller.spec.ts
├── providers/                            # 도서 공급처 포트와 어댑터
│   ├── book-catalog.types.ts             # 포트 인터페이스 + 주입 토큰
│   ├── aladin-book-catalog.provider.ts   # 알라딘 어댑터 (2026-10-30 종료 예정)
│   └── local-db-book-catalog.provider.ts # 자체 DB 어댑터 (최후 방어선)
├── services/
│   ├── book.service.ts (+ spec)          # 도서 마스터 조회·동기화·통계
│   ├── book-catalog.service.ts (+ spec)  # 공급처 체인 오케스트레이터
│   └── aladin-book-search.service.ts     # 알라딘 Open API 호출
├── entities/book.entity.ts               # isbn을 PK로 사용
├── dtos/book-info.dto.ts
├── pipes/book-resolve.pipe.ts            # ISBN → Book 보장 파이프
└── interceptors/book-view-count.interceptor.ts
```

## 2. API 엔드포인트

| 메서드 | 경로 (`/book/...`) | 인증 | 설명 |
|---|---|:---:|---|
| GET | `/popular` | ❌ | 조회수 기반 인기 도서 |
| GET | `/external/list` | ❌ | 도서 목록 검색 (검색 체인) |
| GET | `/external/detail` | ❌ | 도서 상세 조회 (상세 체인) |
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
  └─ 없으면 → 외부 공급처 조회 → Book 생성 → 반환
```

동시 요청에는 **Request Collapsing**을 적용해 같은 ISBN에 대한 외부 API 호출을 한 번으로 합칩니다. 인기 도서에 요청이 몰릴 때 알라딘 호출이 중복되지 않습니다.

### `BookResolvePipe`

컨트롤러 파라미터 단계에서 `resolveBook`을 호출해, **서비스 레이어에 도달했을 때는 항상 해당 도서가 DB에 존재함**을 보장합니다.

- Body의 `isbn` 필드 (또는 위시리스트의 `type: "BOOK"` + `id`)
- Param의 ISBN 문자열

판매글 생성(`POST /book/sale`), 위시리스트 추가 등에서 사용합니다. 덕분에 각 서비스가 "책이 없으면 만들기" 분기를 반복 구현하지 않습니다.

### 조회수

`BookViewCountInterceptor`(공용 `BaseViewCountInterceptor` 확장)가 중복 요청을 걸러 `viewCount`를 올립니다. 이 값이 `findPopularBooks`의 기준입니다.

### 도서 공급처 (`BookCatalogService` + `providers/`)

외부 서지 공급처는 `BookCatalogProvider` 포트 뒤에 있습니다. 네이버·알라딘이
연달아 종료된 경험 때문에, **공급처를 갈아끼울 때 손대는 곳이 한 군데여야 한다**는
것이 이 구조의 목적입니다.

**검색과 상세는 체인이 다릅니다.** 같은 공급처라도 경로에 따라 유불리가 반대라
경로를 나눠 두었습니다.

```
BookCatalogService.search()      BOOK_SEARCH_PROVIDERS
  ├─ AladinBookCatalogProvider   (~2026-10-30)
  └─ LocalDbBookCatalogProvider  (방어선)

BookCatalogService.findByIsbn()  BOOK_DETAIL_PROVIDERS
  ├─ LocalDbBookCatalogProvider  (PK 단건 조회)
  └─ AladinBookCatalogProvider   (자체 DB에 없는 첫 방문 ISBN만)
```

| | 자체 DB 쿼리 | 인덱스 | 그래서 |
|---|---|---|---|
| 검색 | `title/author ILIKE '%q%'` | 없음 | 풀스캔. 게다가 결과가 한 건이라도 나오면 체인이 멈춰 신간이 사라진다 → **외부 우선** |
| 상세 | `findOneBy({ isbn })` | PK | 인덱스 단건. 상세 진입 시 `BookResolvePipe`가 이미 적재해 둔 책을 외부에 다시 묻는 낭비가 없어진다 → **자체 DB 우선** |

검색 체인에서 자체 DB를 1차로 올리는 것은 `title`/`author` 인덱스 도입 이후에
다시 판단합니다.

**체인 순서는 `book.module.ts`의 두 배열로만 정합니다.** 공급처가 또 바뀌어도
손대는 곳은 거기 하나입니다.

#### 실패 처리 — 장애와 "책 없음"의 구분

- 공급처가 던지면 로그를 남기고 다음으로 넘어갑니다. 하나가 죽어도 조회가 죽지 않습니다.
- **빈 결과를 "책 없음"으로 인정하려면, 판정 자격이 있는 공급처가 최소 하나
  정상 응답해야 합니다.** 아무도 응답하지 못했다면 장애이므로 예외를 전파합니다.
  이걸 뒤집으면 장애가 404로 둔갑해 ISR 캐시에 24시간 고착됩니다.

판정 자격은 `BookCatalogProvider.kind`로 정합니다.

| `kind` | "못 찾음"의 의미 | 판정 자격 |
|---|---|---|
| `external` | 그런 책이 없다 | ✅ |
| `local` | **우리가 아직 안 가졌다** | ❌ |

자체 DB는 못 찾아도 예외를 던지지 않습니다. 그래서 이걸 판정에 포함하면 외부가
전부 죽어도 늘 "책 없음"이 되어 위 보호장치가 통째로 무력해집니다. 실제로 자체 DB
어댑터를 도입한 시점부터 그 상태였고 2026-09-07에 고쳤습니다.

외부 공급처가 하나도 등록되지 않은 구성(알라딘 제거 후 자체 DB 단독)에서는 자체
DB가 그 자격을 대신합니다. 그 구성에서는 우리가 가진 것이 곧 전부이기 때문입니다.

#### 알라딘 어댑터 (`AladinBookSearchService`)

| 메서드 | 알라딘 API |
|---|---|
| `searchFormatted` | `ItemSearch.aspx` |
| `searchDetailFormatted` | `ItemLookUp.aspx` |

`ALADIN_TTB_KEY`가 필요합니다. 표지 이미지 고화질 변환은 `@bookjeok/core`의
`formatAladinCoverImage`가 담당합니다.

**벤더 응답 타입(`AladinBookItem`, `AladinSearchResponse`)은 이 서비스 파일 안에만
둡니다.** 공유 패키지나 웹으로 새어나가면 공급처를 바꿀 때 손댈 곳이 늘어납니다.
포트 밖으로 나가는 형태는 항상 `@bookjeok/core`의 `BookInfo`로 정규화합니다.

## 5. 다른 모듈에서의 사용

`BookService`와 `BookResolvePipe`는 `exports`되어 `used-book-sale`, `review`, `reading-log`, `wishlist`가 사용합니다. 도서 마스터 데이터를 만드는 경로는 **이 모듈 하나로 유지**하세요.

## 6. 관련

- 웹: [`features/book`](../../../../web/src/features/book/README.md)
- AI 요약: [`features/llm`](../llm/README.md) · AI 추천: [`features/search`](../search/README.md)
- 인기 검색어: [`features/search-keyword`](../search-keyword/README.md)
