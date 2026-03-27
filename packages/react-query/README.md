# @bookjeok/react-query

Tanstack Query(React Query)를 기반으로 한 북적 플랫폼 공용 데이터 페칭 및 상태 관리 훅 패키지입니다.

## 🏛 설계 원칙 (Explicit DI)

이 패키지의 모든 훅은 **명시적 의존성 주입(Explicit Dependency Injection)** 패턴을 따릅니다.

### 기존 방식 (암시적)
- `useApiClient` 컨텍스트에서 인스턴스를 가져옴 -> 서버 컴포넌트 호환 안 됨, 멀티 플랫폼 이식성 낮음.

### 변경된 방식 (명시적)
- 훅 호출 시 첫 번째 인자로 필요한 `AxiosInstance`를 직접 전달합니다.
- `usePopularBooksQuery(publicAxios)`

## 🚀 사용법

### 1. 웹 앱에서의 사용 (래퍼 활용)
웹 앱에서는 매번 인스턴스를 넘기는 번거로움을 피하기 위해 피처별 래퍼를 권장합니다.
```typescript
// apps/web/src/features/book/queries.ts
import { usePopularBooksQuery as useBaseQuery } from "@bookjeok/react-query";
import { publicAxios } from "@/shared/libs/axios";

export const usePopularBooksQuery = () => useBaseQuery(publicAxios);
```

### 2. Expo 앱에서의 사용
```typescript
// apps/expo/hooks/useBook.ts
import { usePopularBooksQuery } from "@bookjeok/react-query";
import { mobileAuthAxios } from "../libs/axios";

const { data } = usePopularBooksQuery(mobileAuthAxios);
```

## 📂 폴더 구조
- `src/features/*`: 도메인별 쿼리 및 뮤테이션 훅.
- `src/utils`: 쿼리 키 팩토리 등 유틸리티.

## ⚠️ 주의사항
- 훅 내부에 토스트(`toast.error`)나 라우터(`router.push`) 등 **웹 전용 UI 부수 효과를 직접 작성하지 마세요.**
- 성공/실패 처리는 호출부에서 `onSuccess`, `onError` 콜백이나 래퍼 훅을 통해 처리해야 합니다.

## 📌 Exports 제외 Feature 안내

아래 feature는 폴더(`src/features/`)와 소스 파일 구조는 마련되어 있지만 **`@bookjeok/api-client`에 대응 API가 없어 `package.json` exports에서 제외**되어 있습니다.

| Feature | 상태 |
|---|---|
| `intro` | 미구현 (추후 추가 예정) |
| `recommend` | 미구현 (추후 추가 예정) |

대응 API 구현 완료 후 `package.json`의 `exports`와 `tsup.config.ts`의 `entry`에 해당 경로를 추가하세요.
