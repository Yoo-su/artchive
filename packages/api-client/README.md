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
// 반드시 루트(@bookjeok/api-client)를 통해 임포트하세요.
import { getPopularBooks } from "@bookjeok/api-client";
// 프로젝트별 Axios 인스턴스 (예: apps/web/src/shared/libs/axios.ts)
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

## 🏗️ 개발 가이드 (Development)

1. **상대 경로 사용**: 패키지 내 다른 모듈 참조 시 반드시 **상대 경로**를 사용하세요. 배럴 파일(`index.ts`) 등을 통한 자기 참조는 순환 의존성을 유발합니다.
2. **비즈니스 로직 금지**: 이 패키지는 순수 통신 엔진 역할만 수행합니다. React Hook이나 상태 관리가 필요한 로직은 `@bookjeok/react-query`에 작성하세요.
3. **새 기능 추가**: `src/features/*` 하위에 모듈화하여 추가하고, `index.ts`에서 루트 익스포트 처리합니다.

## 📌 Exports 제외 Feature 안내

아래 feature는 폴더(`src/features/`)와 소스 파일 구조는 마련되어 있지만 **아직 API가 구현되지 않아 `package.json` exports에서 제외**되어 있습니다.

| Feature | 상태 |
|---|---|
| `intro` | 미구현 (추후 추가 예정) |
| `recommend` | 미구현 (추후 추가 예정) |

구현 완료 후 `package.json`의 `exports`와 `tsup.config.ts`의 `entry`에 해당 경로를 추가하세요.
