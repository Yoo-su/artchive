# 03. 프론트엔드(Next.js Web & Admin) 컨벤션

> `apps/web` 및 `apps/admin` 개발 시 준수해야 하는 라우팅, 상태 관리, 실시간 통신 및 UI 규칙입니다.

---

## 1. 라우트 경로 상수 (`PATHS`)

**파일**: `apps/web/src/shared/constants/paths.ts`

- **규칙**: 라우트 이동(`router.push`, `router.replace`) 및 `<Link href="...">` 시 문자열 하드코딩 절대 금지. 항상 `PATHS.XXX` 사용.

```typescript
export const PATHS = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  VERIFY_EMAIL: "/verify-email",
  LOUNGE: "/lounge",
  BOOK_MARKET: "/book/market",
  BOOK_SALES_DETAIL: (id: string | number) => `/book/sales/${id}`,
  MY_PAGE: "/my-page",
  USER_PROFILE: (handle: string) => `/users/${handle}`,
  ORDER_PAYMENT: (orderId: string | number) => `/order/payment/${orderId}`,
} as const;
```

---

## 2. 상태 관리 (Zustand)

- 스토어 위치: `features/[feature]/stores/`
- 영속성: 인증/최근 본 데이터 등은 `zustand/middleware`의 `persist` 사용 (`auth-storage`, `recent-book-storage`).
- 셀렉터 패턴: 불필요한 전체 재렌더링 방지를 위해 개별 상태 구독.
```typescript
const user = useAuthStore((state) => state.user);
```

---

## 3. 실시간 통신 & 이벤트 (WebSocket)

### 3-1. 채팅 시스템
- 메시지 타입: `ChatMessageType` (`TEXT`, `SYSTEM`, `TRADE_STATUS`, `TRADE_ACTION`).
- 거래 상태 변경 시 `TRADE_STATUS` 소켓 수신 → TanStack Query 캐시 자동 갱신 (`orderKeys`, `bookSaleKeys`, `chatKeys`).
- 모바일 백그라운드 복귀 대응: 재연결 시 `joinRooms` 자동 재전송.

### 3-2. 알림 시스템
- `NotificationType` (14종): 리뷰 반응, 댓글, 중고거래 결제·배송·구매확정·취소 라이프사이클.
- `NotificationProvider`에서 실시간 수신 → TanStack Query 캐시 갱신 및 토스트 알림 노출.

---

## 4. UI 컴포넌트 & 피드백

- **컴포넌트 라이브러리**: `shadcn/ui` 및 Radix UI 프리미티브 기반 컴포넌트 (`shared/components/shadcn/`).
- **피드백**: 브라우저 기본 `alert()` 사용 금지. 반드시 `sonner`의 `toast.success()`, `toast.error()` 사용.
- **이미지 최적화**: `next/image`의 `<Image />` 사용 (`<img>` 직접 사용 지양).

---

## 5. 인증 및 토큰 갱신 플로우

- **Ticket Exchange**: OAuth 로그인 후 60초 유효 1회용 ticket 발급 → 프론트엔드가 `POST /auth/exchange`로 JWT 수신.
- **Silent Refresh**: `packages/api-client` 및 `apps/web/src/shared/libs/axios.ts`의 인터셉터가 401 발생 시 Refresh Token으로 자동 갱신.
- **토큰 무효화**: 로그아웃 시 백엔드 `user.tokenVersion` 증가로 즉시 무효화.
