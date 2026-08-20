# @bookjeok/react-query

TanStack Query(React Query v5)를 기반으로 한 북적 플랫폼 공용 데이터 페칭 및 캐시 상태 관리 훅 패키지입니다.

---

## 🏛 설계 원칙

1. **`@bookjeok/api-client` & `@bookjeok/core` 기반 표준화**
   - 모든 쿼리/뮤테이션 훅은 내부적으로 `@bookjeok/api-client`의 함수와 `@bookjeok/core`의 쿼리 키 팩토리를 사용합니다.
   - 호출부에서 복잡한 캐시 키나 엔드포인트를 몰라도 훅 하나로 데이터 패칭, 캐싱, 옵티미스틱 업데이트를 수행합니다.

2. **순수 데이터 훅 지향**
   - 훅 내부에서 Toast나 Router 이동 등 특정 UI 프레임워크에 종속된 부수 효과를 유발하지 않습니다.
   - 성공/실패 시 콜백(`onSuccess`, `onError`)이나 반환값을 통해 뷰 계층에서 UI를 제어합니다.

---

## 🚀 사용법

```typescript
"use client";

import { useBookListQuery, useCreateBookSaleMutation } from "@bookjeok/react-query";

export function BookListComponent() {
  // 1. 도서 목록 조회 쿼리
  const { data: books, isLoading } = useBookListQuery({ query: "소설", start: 1 });

  // 2. 판매글 등록 뮤테이션
  const { mutate: createSale, isPending } = useCreateBookSaleMutation({
    onSuccess: (newSale) => {
      console.log("등록 완료:", newSale.id);
    },
  });

  return (
    // ... UI 렌더링
  );
}
```

---

## 📂 패키지 구조

- `src/features/*`: 도메인별 쿼리(`queries.ts`) 및 뮤테이션(`mutations.ts`) 훅
- `src/index.ts`: 루트 배럴 export

---

## 🏗️ 개발 가이드 (Development)

1. **상대 경로 사용**: 패키지 내 다른 모듈 참조 시 반드시 **상대 경로**를 사용하세요.
2. **캐시 무효화 연계**: 뮤테이션 작성 시 연관된 쿼리 키(`@bookjeok/core`의 `bookKeys`, `reviewKeys` 등)를 `queryClient.invalidateQueries`로 무효화하도록 처리하세요.
3. **새 훅 추가 시**:
   - `src/features/[feature]/`에 훅을 작성하고 `src/index.ts`에서 export합니다.
   - 변경 후 `pnpm --filter @bookjeok/react-query build` (또는 타입 체크)로 검증합니다.
