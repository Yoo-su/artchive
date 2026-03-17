# Used Book Sale Feature (중고책 판매)

중고책 판매글 관리를 위한 백엔드 feature 모듈입니다.

## 폴더 구조

```
used-book-sale/
├── used-book-sale.module.ts     # 모듈 설정 (GiST 인덱스 초기화 포함)
├── entities/
│   └── used-book-sale.entity.ts # UsedBookSale, SaleStatus
├── controllers/
│   └── used-book-sale.controller.ts
├── services/
│   └── used-book-sale.service.ts
├── dtos/
│   ├── create-book-sale.dto.ts
│   ├── update-book-sale.dto.ts
│   ├── query-book-sale.dto.ts   # BookSaleSortBy, SortOrder
│   └── get-book-sales-query.dto.ts
├── interceptors/
│   └── used-book-view-count.interceptor.ts
└── utils/
    └── sale-query.builder.ts    # 커서 페이지네이션, 위치 정렬
```

## API 엔드포인트

| 메서드 | 경로                     | 인증 | 설명                 |
| ------ | ------------------------ | ---- | -------------------- |
| POST   | `/book/sale`             | 🔒   | 판매글 생성          |
| GET    | `/book/sales`            | -    | 판매글 검색          |
| GET    | `/book/sales/recent`     | -    | 최근 판매글          |
| GET    | `/book/sales/popular`    | -    | 인기 판매글          |
| GET    | `/book/sales/:id`        | -    | 판매글 상세          |
| GET    | `/book/sales/:id/edit`   | 🔒   | 수정용 조회 (본인만) |
| PATCH  | `/book/sales/:id`        | 🔒   | 판매글 수정          |
| PATCH  | `/book/sales/:id/status` | 🔒   | 상태 변경            |
| DELETE | `/book/sales/:id`        | 🔒   | 판매글 삭제          |
| GET    | `/book/:isbn/sales`      | -    | ISBN별 판매글        |

## SaleStatus Enum

```typescript
enum SaleStatus {
  FOR_SALE = 'FOR_SALE', // 판매중
  RESERVED = 'RESERVED', // 예약중
  SOLD = 'SOLD', // 판매완료
  WITHDRAWN = 'WITHDRAWN', // 판매취소
}
```

## 커서 페이지네이션

판매글 검색(`GET /book/sales`)은 커서 기반 페이지네이션을 사용합니다.

```json
// 응답
{
  "sales": [...],
  "total": 100,
  "hasNextPage": true,
  "nextCursor": "base64-encoded-cursor"
}
```

다음 페이지 요청 시 `?cursor={nextCursor}` 파라미터를 전달합니다.

## 거리 기반 정렬

`sortBy=distance` 사용 시 `lat`, `lng` 파라미터 필수:

- GiST 인덱스 사용하여 PostGIS 거리 계산
- `radius` (km) 파라미터로 검색 반경 제한 가능

## 모듈 의존성

- `BookModule`: 책 정보 조회/생성
- `UserModule`: 작성자 정보 조회
