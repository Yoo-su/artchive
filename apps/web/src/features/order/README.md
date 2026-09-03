# Frontend Feature: Order (에스크로 결제 · 주문 관리 · 거래 후기)

토스페이먼츠 에스크로 결제 플로우와 주문 관리 UI를 담당합니다. 서버의 [`order` 모듈](../../../../server/src/features/order/README.md)과 짝을 이루며, 데이터 통신은 전부 `@bookjeok/react-query` 훅을 통합니다.

---

## 폴더 구조

```
order/
├── index.ts                             # 배럴 export
├── components/
│   ├── address-input.tsx                # 다음 우편번호 기반 배송지 입력
│   ├── payment-summary.tsx              # 결제 금액 요약
│   ├── escrow-info-card.tsx             # 에스크로 안내 카드
│   ├── modals/
│   │   ├── shipping-form-modal.tsx      # 판매자 운송장 등록
│   │   ├── dispute-modal.tsx            # 구매확정 거부(이의 제기)
│   │   └── trade-review-modal.tsx       # 거래 후기 작성/수정
│   ├── order-detail/
│   │   ├── order-detail-card.tsx
│   │   └── order-status-timeline.tsx    # 주문 상태 타임라인
│   ├── my-purchases/                    # 내 구매 내역 (list / card / skeleton)
│   ├── my-sales-orders/                 # 내 판매 주문 (list / card / skeleton)
│   └── trade-review/
│       ├── trade-review-card.tsx
│       ├── user-trade-reviews-list.tsx
│       ├── seller-stats-card.tsx        # 거래 완료 건수 · 긍정 후기 비율
│       └── seller-trust-badge.tsx       # 프로필/판매글의 신뢰 배지
├── utils/
│   └── order-storage.ts                 # 배송지 스냅샷 임시 저장
└── __tests__/                           # 7개 테스트 파일
```

---

## 관련 라우트 & 뷰

| 라우트 | View | 설명 |
|---|---|---|
| `/order/[orderId]` | `order-detail-view` | 주문 상세 및 단계별 액션 |
| `/order/payment/[orderId]` | `order-payment-view` | 배송지 입력 + 토스 결제 요청 |
| `/order/payment/success` | `order-payment-success-view` | 결제 승인 콜백 |
| `/order/payment/fail` | `order-payment-fail-view` | 결제 실패 콜백 |
| `/my-page/purchases` | `my-purchases-view` | 내 구매 내역 |
| `/my-page/sales-orders` | `my-sales-orders-view` | 내 판매 주문 |

---

## 결제 플로우

```
채팅방에서 판매자가 구매자 지정 (Order 생성, AWAITING_PAYMENT)
        │
        ▼
/order/payment/[orderId]
  ① AddressInput — 다음 우편번호로 배송지 입력
  ② savePendingOrderShipping() — sessionStorage + localStorage에 스냅샷 저장
  ③ loadTossPayments() → payment.requestPayment({ successUrl, failUrl })
        │
        ▼  (결제창 / 모바일 앱카드 전환)
/order/payment/success?paymentKey=...&orderId=...&amount=...
  ④ getPendingOrderShipping() — 저장해둔 배송지 복원
  ⑤ POST /orders/:id/pay — 승인 요청 + 배송지 전송
  ⑥ clearPendingOrderShipping()
        │
        ▼
/order/[orderId]  (PAID)
```

### 배송지 스냅샷을 로컬에 저장하는 이유

모바일 앱카드 결제는 외부 앱으로 전환됐다가 **새 탭/새 세션**으로 돌아오는 경우가 있습니다. 이때 React 상태에만 있던 배송지 입력값이 통째로 사라집니다. `order-storage.ts`는 주문 ID를 키로 `sessionStorage`와 `localStorage` 양쪽에 저장하고(24시간 TTL), 성공 콜백에서 복원한 뒤 즉시 삭제합니다.

> 금액은 저장하지 않습니다. 결제 금액 검증은 전적으로 서버에서 판매글 가격과 대조합니다.

---

## 주문 상태별 UI

`order-status-timeline`이 `OrderStatus`에 따라 진행 단계를 표시하고, 각 역할에게 가능한 액션만 노출합니다.

| 상태 | 구매자 | 판매자 |
|---|---|---|
| `AWAITING_PAYMENT` | 결제하기 / 취소 | 구매자 지정 취소 |
| `PAID` | 취소 요청 | 운송장 등록 / 취소 |
| `SHIPPED` | 배송 조회 | 배송 조회 |
| `DELIVERED` | 구매확정 / 이의 제기 | — |
| `CONFIRMED` | 거래 후기 작성 (14일 이내) | 후기 확인 |
| `DISPUTED` | 협의 안내 | 협의 안내 |
| `CANCELLED` | 취소 사유 표시 | 취소 사유 표시 |

---

## Feature Flag

`NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED`가 `true`가 아니면 결제 진입 지점을 숨깁니다. 서버 쪽 `PaymentFeatureGuard`가 최종 방어선이므로, 프론트 플래그는 UI 노출 제어용입니다. **두 플래그는 항상 같은 값으로 맞춰야 합니다.**

---

## 거래 후기

- 구매확정 후 **14일 이내** 작성·수정 가능, 삭제 불가
- 프리셋 태그(긍정 5종 / 부정 4종) 선택 + 선택적 텍스트
- `seller-stats-card` / `seller-trust-badge`는 "거래 완료 N건 · 긍정 후기 N%" 팩트 수치만 표시합니다. 별점 환산이나 등급 같은 가공 지표는 쓰지 않습니다.

---

## 테스트

`__tests__/`에 Vitest + Testing Library 기반 7개 파일이 있습니다.

| 파일 | 대상 |
|---|---|
| `payment-flow.test.tsx` | 결제 요청 및 성공/실패 콜백 |
| `address-input.test.tsx` | 배송지 입력 및 우편번호 연동 |
| `order-detail.test.tsx` | 상태별 액션 노출 |
| `my-purchases.test.tsx` / `my-sales-orders.test.tsx` | 목록 렌더링 |
| `shipping-dispute-modals.test.tsx` | 운송장·이의 제기 모달 |
| `trade-review.test.tsx` | 후기 작성/수정 |

```bash
pnpm --filter @bookjeok/web test
```

---

## 관련 환경 변수

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` | 토스 결제 위젯 클라이언트 키 |
| `NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED` | 결제 UI 노출 플래그 |
