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
├── constants.ts                 # 목록 크기, 정렬 기본값 등
├── interceptors/
│   └── used-book-view-count.interceptor.ts
├── listeners/
│   └── used-book-sale-cleanup.listener.ts   # user.withdrawn
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
| GET    | `/book/sales/regions`    | -    | 등록된 지역(시/도·시/군/구) 목록 |
| GET    | `/book/sales/:id`        | -    | 판매글 상세          |
| GET    | `/book/sales/:id/edit`   | 🔒   | 수정용 조회 (본인만) |
| PATCH  | `/book/sales/:id`        | 🔒   | 판매글 수정          |
| PATCH  | `/book/sales/:id/status` | 🔒   | 상태 변경            |
| DELETE | `/book/sales/:id`        | 🔒   | 판매글 삭제          |
| POST   | `/book/sales/:id/view`   | -    | 판매글 조회수 기록   |
| GET    | `/book/:isbn/sales`      | -    | ISBN별 판매글        |

## SaleStatus Enum

```typescript
enum SaleStatus {
  FOR_SALE = 'FOR_SALE', // 판매중
  RESERVED = 'RESERVED', // 예약중 (활성 주문 존재)
  SOLD = 'SOLD', // 판매완료 (구매확정)
  WITHDRAWN = 'WITHDRAWN', // 판매취소
}
```

`RESERVED` / `SOLD` 전이는 [`order`](../order/README.md) 모듈이 주문 상태에 따라 자동으로 수행합니다. 활성 주문이 있는 판매글은 사용자가 임의로 상태를 바꾸거나 삭제할 수 없습니다.

## TradeMethod Enum

```typescript
enum TradeMethod {
  DIRECT_ONLY = 'DIRECT_ONLY',     // 직거래만 (결제 없음, 채팅 중계)
  DELIVERY_ONLY = 'DELIVERY_ONLY', // 택배만 (에스크로 결제)
  BOTH = 'BOTH',                   // 둘 다 가능
}
```

기본값은 `DIRECT_ONLY`입니다. `DIRECT_ONLY` 판매글에는 온라인 주문을 생성할 수 없습니다.

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

- PostgreSQL `cube` + `earthdistance` 확장의 `ll_to_earth()` GiST 인덱스로 거리 계산 (PostGIS 미사용)
- `radius` (km) 파라미터로 검색 반경 제한 가능

## 이메일 인증

판매글 작성은 `EmailVerifiedGuard`를 통과해야 합니다(`isEmailVerified === true`). 사기·어뷰징 방어 목적이며, 미인증 시 `EMAIL_NOT_VERIFIED` 403이 반환됩니다.

## 이벤트

| 이벤트 | 리스너 | 동작 |
|---|---|---|
| `user.withdrawn` | `UsedBookSaleCleanupListener` | 탈퇴 회원의 판매글 정리 |

## 모듈 의존성

- `BookModule`: 책 정보 조회/생성 (`BookResolvePipe`)
- `UserModule`: 작성자 정보 조회
- `Order` 엔티티: 활성 주문 확인 (수정·삭제·상태 변경 차단 판정)

## 관련

- 웹: [`features/book-sale`](../../../../web/src/features/book-sale/README.md)
- 결제·주문: [`features/order`](../order/README.md)
