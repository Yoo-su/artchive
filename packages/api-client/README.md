# @bookjeok/api-client

북적 백엔드 API와의 통신을 담당하는 기본 클라이언트 라이브러리입니다.

## 🛠 주요 특징

### 1. 명시적 인스턴스 주입
- 모든 API 함수는 첫 번째 인자로 `AxiosInstance`를 전달받습니다.
- 웹 환경(`privateAxios`, `publicAxios`)과 모바일 환경(`authAxios` 등)의 차이를 호출부에서 결정할 수 있게 합니다.

### 2. 공통 에러 핸들링 (`handleApiError`)
- HTTP 상태 코드별 공통 메시지 추출 로직을 내장하고 있습니다.
- UI 알림(Toast/Alert) 처리는 콜백(`onShowError`)으로 분리하여 플랫폼 독립성을 유지합니다.

## 🚀 사용법

### API 호출 예시
```typescript
import { getPopularBooks } from "@bookjeok/api-client";
import { publicAxios } from "./libs/axios";

const data = await getPopularBooks(publicAxios);
```

### 에러 핸들링 예시
```typescript
import { handleApiError } from "@bookjeok/api-client";

handleApiError(error, {
  onShowError: (msg) => alert(msg), // 플랫폼에 맞는 UI 처리
  context: "Login"
});
```

## 🏗 아키텍처 가이드
- 새로운 API 추가 시 반드시 `packages/api-client/src/features` 아래에 모듈화하여 추가하세요.
- 비즈니스 로직(상태 관리 등)은 이 패키지에 포함시키지 말고 `@bookjeok/react-query`를 사용하세요.
 stone
