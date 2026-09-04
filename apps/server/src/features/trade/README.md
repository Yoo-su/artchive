# Trade Feature (거래 완료 · 거래 후기)

"거래가 성사됐다"는 사실과 그에 붙는 후기를 담당합니다. **결제와 분리된 모듈**입니다.

---

## 왜 결제(Order)와 분리했나

처음에는 거래 후기가 `Order`에 1:1로 매달려 있었습니다. 그런데 북적의 중고거래는
두 갈래입니다.

| 경로 | 결제 | 서비스가 이행을 검증하나 |
| --- | --- | --- |
| 직거래 | 없음. 채팅으로 약속을 잡고 만나서 거래 | ✗ 판매자 자기신고 |
| 택배 거래 | 토스페이먼츠 에스크로 | ✓ 배송 추적 + 구매확정 |

후기가 `Order`에만 붙어 있으면 **직거래로 아무리 거래해도 후기를 남길 수 없습니다.**
게다가 사업자 등록·PG 승인 문제로 결제가 봉인된 동안에는 서비스 전체에 후기가
하나도 쌓이지 않았습니다.

그래서 결제와 완료를 갈랐습니다.

- **`Order`** — "돈이 어떻게 오갔는가". 에스크로 결제·배송·환불 기계장치.
- **`TradeCompletion`** — "거래가 성사됐다". 결제 여부와 무관한 사실.
- **`TradeReview`** — `TradeCompletion`에 붙습니다.

택배 거래도 구매확정(`CONFIRMED`) 시점에 완료 기록을 하나 만들기 때문에,
**후기와 신뢰 지표는 결제 여부와 상관없이 단 하나의 경로만 봅니다.**

```
직거래:  판매자가 완료 처리 ──────────────┐
                                          ├──> TradeCompletion ──> TradeReview
택배거래: Order CONFIRMED ────────────────┘
```

---

## 폴더 구조

```
trade/
├── trade.module.ts
├── entities/
│   ├── trade-completion.entity.ts   # TradeCompletion, TradeCompletionMethod
│   └── trade-review.entity.ts       # TradeReview
├── controllers/
│   ├── trade-completion.controller.ts  # 예약·완료 API
│   └── trade-review.controller.ts      # 후기 API
├── services/
│   ├── trade-completion.service.ts     # 예약/완료 상태 전이
│   └── trade-review.service.ts         # 후기 CRUD, 신뢰 지표 집계
├── listeners/
│   └── trade-event.listener.ts         # 거래 이벤트 → 알림 + 채팅 시스템 메시지
└── dtos/
```

의존 방향은 **order → trade** 한 방향입니다. `TradeModule`은 order의 *엔티티*만
읽고 `OrderModule` 자체는 import 하지 않습니다.

---

## 직거래 상태 흐름

```
FOR_SALE ──[채팅방: 이 분과 거래하기]──> RESERVED (+ reservedForUserId)
    ^                                        │
    └────────[예약 취소]────────────────────┤
                                             │
                                       [거래 완료]
                                             │
                                             v
                              SOLD + TradeCompletion(DIRECT)
                                             │
                                             v
                              양측 각 1건씩 후기 (14일 이내)
```

결제 흐름의 `selectBuyer` / `cancelSelection` / `confirm`과 같은 모양이고,
돈이 빠졌을 뿐입니다.

### `reservedForUserId`가 왜 필요한가

예약중은 판매자의 내부 메모가 아니라 **다른 구매희망자에게 보내는 신호**입니다.
"이 분과 얘기 중이니 잠깐 기다려주세요." 그 신호가 성립하려면 상대가 누구인지
남아 있어야 합니다. 그래야

- 다른 채팅방에 "다른 구매자와 거래 진행 중" 안내를 띄우고,
- 완료 시 후기 상대를 자동으로 정할 수 있습니다.

### 상대는 언제 정해지나

**가능한 한 빨리, 늦어도 완료 시점에** 정해집니다. 예약중·판매완료 어느 쪽으로
바꾸든 화면이 거래 상대를 묻습니다.

| 경로 | 상대가 정해지는 시점 |
| --- | --- |
| 채팅방 "이 분과 거래하기" | 예약 시점 (그 방의 상대로 자동) |
| 마이페이지·상세의 상태 변경 | 예약 시점 (후보 목록에서 선택) |

상대를 지정하지 않고 예약중으로만 두는 것도 허용합니다(nullable).
서비스 밖에서 알게 된 사람과 거래한 경우를 막지 않기 위해서입니다. 이때는

- 다른 구매희망자에게 "다른 구매자와 거래 중"(특정인 암시) 대신 중립적인
  "판매자가 예약중으로 표시했습니다"가 나가고,
- 완료 시점에 다시 상대를 묻습니다. 거기서도 건너뛰면 완료 기록이 생기지 않아
  **후기가 열리지 않고 신뢰 지표에도 잡히지 않습니다.**

즉 `trade_completions`에 행이 없으면 그 거래는 서비스가 아는 거래가 아닙니다.

---

## 후기

### 양방향

한 거래당 **양쪽이 각각 한 건씩** 씁니다 (`UNIQUE(completionId, reviewerId)`).
직거래는 양쪽 모두 리스크를 지므로 판매자도 구매자를 평가할 수 있어야 합니다.

### 태그는 거래 방식·상대 역할에 따라 갈린다

태그 정의와 적용 규칙은 **`@bookjeok/core`의 `features/trade/review-tags.ts`
한 곳**에 있습니다. 서버 검증과 클라이언트 렌더링이 같은 규칙을 씁니다.

| 구분 | 예시 |
| --- | --- |
| 공통 (양방향) | 친절하고 매너가 좋아요 / 응답이 빨라요 / 약속을 잘 지켜요 |
| 구매자 → 판매자 | 책 상태가 설명과 같아요 |
| 구매자 → 판매자 (택배만) | 배송이 빨라요 / 포장이 꼼꼼해요 |
| 판매자 → 구매자 | 거래가 매끄러웠어요 / 과도한 흥정 / 노쇼 |

직거래에 배송·포장 태그를 노출하면 고를 수 없는 항목이 되고, 구매자에게
"책 상태가 좋아요"를 붙이면 뜻이 통하지 않습니다. `getAvailableTradeReviewTags()`가
이 필터링을 담당하고, 서버는 `assertTagsAllowed()`로 같은 규칙을 강제합니다.

### 결제 플래그를 걸지 않는다

`TradeReviewController`에는 `PaymentFeatureGuard`가 **없습니다.** 후기는 완료 기록에
붙고 완료는 결제 없이도 생기므로 결제 봉인과 함께 잠글 이유가 없습니다.

(이전에는 컨트롤러 전체가 가드에 묶여 있어서 후기 목록·신뢰 지표 조회 API까지
503을 반환했습니다.)

---

## 신뢰 지표에서 직거래와 택배를 나누는 이유

`getSellerStats()`는 완료 건수를 `directCompletedSales` / `deliveryCompletedSales`로
나눠 돌려줍니다.

직거래 완료는 **판매자의 자기신고**입니다. 지인과 짜고 완료 처리 후 서로 후기를
남겨 평판을 부풀릴 수 있습니다. 반면 택배 거래 완료는 결제·배송추적·구매확정을
거친 기록입니다. 두 건수를 합쳐서 보여주면 이 차이가 가려지므로 나눠서 노출합니다.

부풀리기를 줄이는 다른 장치:

- 거래 상대는 **같은 채팅방의 활성 참여자**로만 지정할 수 있습니다
  (`assertBuyerReachable`). 아무 사용자나 상대로 넣을 수 없습니다.
- 같은 판매글·같은 상대로 두 번 완료 처리해도 기록은 하나만 남습니다.

---

## 거래 내역 화면

직거래는 `orders` 레코드가 없어 구매내역·판매주문 목록에 잡히지 않습니다.
채팅방을 나가거나 대화가 묻히면 후기 작성 기한(14일)이 조용히 지나가므로,
`GET /trades/completions/my`가 그 창구 역할을 합니다.

응답에는 목록 화면에 필요한 것들을 붙여 보냅니다 — `myRole`, `counterparty`,
`myReview`, `canWriteReview`, `reviewExpiresAt`. 후기는 완료 건마다 따로 조회하지
않고 한 번에 모아 N+1을 피합니다(`decorateWithMyReview`).

후기 수정은 같은 화면에서 진입합니다. 후기는 **삭제할 수 없고** 완료 후 14일
이내에만 고칠 수 있습니다. 기한 상수는 `constants.ts` 한 곳에 있어서 목록의
"수정 가능" 표시와 서버 검증이 어긋나지 않습니다.

---

## 이벤트

| 이벤트 | 알림 | 채팅 시스템 메시지 |
| --- | --- | --- |
| `trade.reserved` | 구매자에게 `TRADE_RESERVED` | 지정 안내 + 타 채팅방에 진행 중 안내 |
| `trade.reservation_cancelled` | — | 전 채팅방에 "다시 판매중" 안내 |
| `trade.completed` | 구매자에게 `TRADE_COMPLETED` | 완료 + 후기 유도 |
| `trade_review.created` | 대상자에게 `TRADE_REVIEW_RECEIVED` | — |

---

## 관련 문서

- [docs/used-book-pay-implementation.md](../../../../../docs/used-book-pay-implementation.md) — 에스크로 결제 도입 계획
- [docs/manual-ddl-log.md](../../../../../docs/manual-ddl-log.md) — 이 모듈의 운영 DDL
- [order/README.md](../order/README.md) — 결제·배송 쪽
