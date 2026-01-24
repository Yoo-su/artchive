# Book Sale Feature (중고책 판매)

중고책 판매글 관리를 위한 프론트엔드 feature 모듈입니다.

## 폴더 구조

```
book-sale/
├── types.ts          # 타입 정의 (UsedBookSale, SaleStatus, DTOs)
├── apis/index.ts       # API 함수 (CRUD, 검색)
├── queries.tsx       # TanStack Query 훅
├── mutations.tsx     # TanStack Mutation 훅
├── constants.ts      # 상수 (MAX_MARKET_PRICE)
├── hooks/            # 커스텀 훅
│   ├── use-book-sale-search-params.ts  # URL 파라미터 파싱
│   ├── use-user-location.ts            # 위치 권한 관리
│   ├── use-book-sale-form.ts           # 등록 폼 로직
│   └── use-book-sale-edit-form.ts      # 수정 폼 로직
├── actions/          # Server Actions
│   ├── upload-action.ts    # 이미지 업로드
│   └── delete-action.ts    # 이미지 삭제
└── components/       # Context-Based Grouping
    ├── sale-market/           # 마켓 메인 (필터 + 그리드)
    ├── sale-detail/           # 판매글 상세 페이지
    ├── sale-form/             # 등록/수정 폼
    ├── my-sales/              # 내 판매 내역
    └── common/                # 공통 컴포넌트
```

## 핵심 타입

```typescript
enum SaleStatus {
  FOR_SALE = "FOR_SALE",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
}

interface UsedBookSale {
  id: number;
  title: string;
  price: number;
  city: string;
  district: string;
  content: string;
  imageUrls: string[];
  status: SaleStatus;
  user: SaleAuthor;
  book: BookInfo;
  viewCount: number;
  latitude?: number;
  longitude?: number;
  placeName?: string;
}
```

## 쿼리 훅

| 훅                          | 용도                      |
| --------------------------- | ------------------------- |
| `useInfiniteBookSalesQuery` | 판매글 검색 (무한 스크롤) |
| `useMyBookSalesQuery`       | 내 판매글 목록            |
| `useBookSaleDetailQuery`    | 판매글 상세               |
| `useBookSaleForEditQuery`   | 수정용 조회               |
| `useRelatedSalesQuery`      | 관련 판매글               |
| `useRecentBookSalesQuery`   | 최근 판매글               |
| `usePopularBookSalesQuery`  | 인기 판매글               |

## 뮤테이션 훅

| 훅                                | 용도        |
| --------------------------------- | ----------- |
| `useCreateBookSaleMutation`       | 판매글 등록 |
| `useUpdateBookSaleMutation`       | 판매글 수정 |
| `useUpdateBookSaleStatusMutation` | 상태 변경   |
| `useDeleteBookSaleMutation`       | 판매글 삭제 |

## 의존성

- `@/features/book`: `BookInfo`, `Book` 타입, `useInfiniteBookSearch` 훅
- `@/features/auth`: 사용자 인증 정보

## API 엔드포인트

모든 API는 `/book/...` 경로를 사용합니다 (백엔드 호환성 유지).
