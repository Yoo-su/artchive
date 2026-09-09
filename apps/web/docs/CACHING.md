# 캐싱 구조

한 번의 방문이 통과하는 캐시는 넷입니다. 각 층은 서로의 존재를 모르고 TTL도 제각각이라, **어느 층이 무엇을 책임지는지**를 먼저 정해두지 않으면 쓰기 후 갱신이 조용히 어긋납니다.

## 층과 책임

| 층                   | 위치          | TTL                | 책임                                                          |
| -------------------- | ------------- | ------------------ | ------------------------------------------------------------- |
| 모듈 레벨 Map        | 서버 프로세스 | 10분               | 알라딘 호출 중복 제거 (`features/book/apis/server.ts`)        |
| ISR Full Route Cache | Next 서버     | 5분~24시간         | 차가운 트래픽·크롤러용 HTML. `dehydrate()` 결과가 여기 구워짐 |
| Router Cache         | 브라우저      | 서버 액션이 무효화 | SPA 재진입 시 재사용되는 RSC 페이로드                         |
| TanStack Query       | 브라우저      | 기본 1분           | **상호작용 중인 사용자의 신선도**                             |

핵심 원칙 하나:

> **ISR은 첫 페인트와 크롤러를 책임지고, TanStack Query는 세션 신선도를 책임진다.**
> 하이드레이트된 데이터는 진실이 아니라 **출발점**이다.

ISR HTML에 구워진 스냅샷은 최대 `revalidate`만큼 과거입니다. 그래서 전역 기본값이 `refetchOnMount: true`이고, 클라이언트는 마운트할 때마다 그 스냅샷을 교정합니다.

## 전역 기본값

`src/shared/libs/query-client.ts`

```ts
staleTime: CACHE_TIME.ONE_MINUTE,
refetchOnMount: true,
gcTime: CACHE_TIME.THIRTY_MINUTES,
retry: 1,
refetchOnWindowFocus: false,
```

`refetchOnMount`는 staleness와 무관한 **절대 게이트**입니다. `false`로 두면 `invalidateQueries`가 비활성 쿼리에 플래그만 세우고 끝나, 그 쿼리가 다시 마운트돼도 낡은 데이터가 그대로 그려집니다. 이 값을 다시 `false`로 되돌리지 마세요. 회귀 테스트는 `src/shared/libs/__tests__/query-client.test.tsx`에 있습니다.

개별 쿼리에서 `staleTime`을 덮어쓰는 건 자유롭습니다. 진짜 변하지 않는 데이터(AI 도서 요약 등)는 `staleTime: Infinity`가 정답입니다.

## 표면 대장

서버가 구워서 클라이언트로 넘기는 캐시 항목의 전부입니다. **이 목록 밖의 쿼리는 ISR과 얽히지 않습니다.**

| 시드 키                          | 굽는 라우트           | ISR TTL | staleTime                        |
| -------------------------------- | --------------------- | ------- | -------------------------------- |
| `bookSale.recentSales(25)`       | `/`                   | 1시간   | 전역 (마켓 히어로만 60초 + 폴링) |
| `book.popularBooks`              | `/`                   | 1시간   | 전역                             |
| `review.list({page:1,limit:5})`  | `/`                   | 1시간   | 전역                             |
| `book.list(출판사, 18)`          | `/`                   | 1시간   | 5분                              |
| `readingLog.loungePopular`       | `/` · `/lounge`       | 1시간   | 5분                              |
| `readingLog.loungeActiveReaders` | `/lounge`             | 1시간   | 5분                              |
| `insights.all`                   | `/insights`           | 6시간   | 전역                             |
| `bookSale.popularSales`          | `/book/market`        | 1시간   | 전역                             |
| `bookSale.marketSales({})`       | `/book/market`        | 1시간   | 전역                             |
| `review.popular`                 | `/book/reviews`       | 1시간   | 전역                             |
| `review.feeds()`                 | `/book/reviews`       | 1시간   | 전역                             |
| `book.popularKeywords`           | `/book/search`        | 1시간   | 호출부 지정                      |
| `user.publicProfile(handle)`     | `/users/[handle]`     | 10분    | 전역                             |
| `book.detail(isbn)`              | `/book/[isbn]/detail` | 24시간  | 5분                              |
| `book.summary(isbn)`             | `/book/[isbn]/detail` | 24시간  | Infinity (불변)                  |
| `review.detail(id)`              | `/book/reviews/[id]`  | 1시간   | 전역                             |
| `bookSale.saleDetail(id)`        | `/book/sales/[id]`    | 5분     | 전역                             |

`readingLog.loungePopular`는 두 라우트가 각각 독립된 시각에 굽습니다. 방문 순서에 따라 더 최신 스냅샷이 이깁니다 (`hydrate()`는 `dataUpdatedAt`이 더 클 때만 덮어씀).

## 재검증 범위 규칙

`src/shared/actions/revalidate.ts`

- **아이템 상세만 즉시 재검증한다.** 그 페이지의 주제가 바뀐 것이므로.
- **목록·홈 같은 집계는 시간 기반 `revalidate`에 위임한다.** 쓰기마다 파기하면 트래픽이 늘수록 적중률이 0에 수렴해 ISR이 사실상 SSR로 퇴화합니다. 상호작용 중인 사용자는 쿼리 무효화 + `refetchOnMount`로 이미 최신을 봅니다.
- **삭제만 예외로 집계까지 비운다.** 목록에 남은 링크가 404로 이어지기 때문입니다.

클라이언트 쿼리 무효화는 서버 캐시에 닿지 않습니다. 둘은 대체재가 아니라 **다른 대상**(본인 / 다른 방문자·크롤러)을 위한 별개 작업입니다.

브라우저 Router Cache는 또 별개라, 호출부는 `purgeRouteCache(재검증, () => router.refresh())`로 순서를 고정합니다. 역순이면 아직 파괴되지 않은 HTML을 다시 캐싱합니다.

## 새 쿼리를 추가할 때

**서버에서 시드하지 않는 쿼리**(클라이언트에서만 조회)라면 신경 쓸 것이 없습니다. 그냥 추가하세요.

**서버에서 시드한다면** (`ServerQueryBoundary`의 `queries` 또는 `setQueryData`):

1. 위 표에 줄을 추가한다.
2. 그 데이터가 화면에 떠 있는 동안 바뀔 수 있는지 따진다. 바뀔 일이 없다면 **애초에 쿼리로 만들지 말고 서버 컴포넌트 props로 내리는 편**이 층을 하나 줄인다.
3. 쓰기 경로가 있다면 무효화 대상 키와 재검증 대상 경로를 함께 배선한다.
4. 쿼리 키는 반드시 `@bookjeok/core`의 키 팩토리에서 만든다. 팩토리 밖의 raw 키는 도메인 접두사 무효화에 걸리지 않는다.

## On-Demand 재검증 웹훅

`src/app/api/revalidate/route.ts` — POST 전용, 시크릿은 `x-revalidate-token` 헤더, ISR 라우트만 허용하는 경로 화이트리스트.

`REVALIDATE_TOKEN`은 **서버 전용**입니다. `NEXT_PUBLIC_` 접두사를 붙이면 브라우저 번들에 실려 공개됩니다. 폴백은 두지 않습니다 — 미설정 시 503으로 실패해 조용히 열려 있는 상태를 만들지 않습니다.
