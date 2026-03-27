# Bookjeok Monorepo Refactoring: Logic Extraction & Core Packages

이 문서는 `apps/web` (Next.js)에 집중되어 있던 비즈니스 로직을 `packages/` 폴더의 공유 패키지로 추출하여 Expo(모바일 앱)와 공유 가능하게 만드는 리팩토링 작업의 목적, 아키텍처, 그리고 현재 진행 상황을 설명합니다.

## 1. 목적 (Objectives)
- **코드 재사용성 극대화**: 웹에서 검증된 비즈니스 로직(API 호출, 상태 관리, 캐시 정책)을 모바일 앱에서도 100% 재사용합니다.
- **환경 독립적 설계 (IoC)**: 브라우저 API(`localStorage`)나 특정 UI 라이브러리(`sonner`)에 대한 의존성을 제거하여 어떤 환경에서도 동작하도록 합니다.
- **단일 진실 공급원 (SSOT)**: 타입 정의와 API 스펙을 중앙 관리하여 웹과 앱 사이의 정렬 상태를 유지합니다.

## 2. 아키텍처 (Architecture)

### 2.1 패키지 구조
- **`@bookjeok/core`**: 
  - 순수 TypeScript 패키지.
  - 공통 타입(`interface`, `enum`), 상수(`API_PATHS`, `CACHE_TIME`), 유틸리티 포함.
- **`@bookjeok/api-client`**:
  - `axios` 기반의 API 요청 함수 정의.
  - **특징**: `AxiosInstance`를 외부에서 주입받아 사용(IoC). 특정 저장소나 인터셉터 로직에 의존하지 않음.
- **`@bookjeok/react-query`**:
  - `@tanstack/react-query` 기반의 전역 상태 및 데이터 페칭 훅.
  - **특징**: `ApiClientProvider`를 통해 주입된 `AxiosInstance`를 사용하여 모든 훅이 동작함.

### 2.2 인증 및 스토리지 전략 (IoC 패턴)
웹(`localStorage`)과 앱(`SecureStore`)의 처리 방식 차이를 해결하기 위해 다음 패턴을 따릅니다.
1. 각 앱(Web/Expo)에서 플랫폼에 맞는 Axios 인터셉터를 설정합니다.
2. 설정된 Axios 인스턴스를 `@bookjeok/react-query`의 `ApiClientProvider`에 주입합니다.
3. 모든 하위 훅들은 주입된 클라이언트를 통해 인증 정보를 자동으로 포함하여 요청을 보냅니다.

## 3. 리팩토링 진행 상황 (Final Status - 2026-03-26)

### 3.1 진행 요약
- **전체 진행률**: 100% (완료)
- **최종 완성도**: 모든 피처가 동일한 아키텍처 패턴("Local Feature Wrapper")을 준수하며, 플랫폼 독립적인 구조로 통일되었습니다.

### 3.2 주요 성과
- **Local Feature Wrapper 패턴 확립**: 모든 피처(`apps/web/src/features/*/`)가 `@bookjeok/react-query`의 훅을 가져와 플랫폼별 Axios 인스턴스(`publicAxios`, `privateAxios`)를 주입한 형태의 독립 래퍼를 제공합니다.
- **표준화된 타입 시스템 (SSOT)**: 모든 피처 내 `types.ts`가 `@bookjeok/core`로부터 명시적으로 재내보내기(re-export) 하도록 통일되었습니다.
- **사용자 경험 통일**: `auth`, `book-sale`, `reading-log` 등 주요 뮤테이션에 `sonner` 기반의 일관된 토스트 알림 로직이 결합되었습니다.
- **빌드 안정성 확보**: 패키지 간 순환 참조 및 초기화 순서 문제를 패키지 인덱스(`index.ts`) 최적화를 통해 해결하였습니다.

## 4. 기술적 이슈 해결 상세 (Technical Deep-Dive)

### 4.1 Local Feature Wrapper 패턴 (DI implementation)
이 패턴은 UI 컴포넌트가 플랫폼 종속적인 Axios 인스턴스를 직접 다루지 않게 합니다.
- **Before**: 컴포넌트에서 `useMutation(..., axiosInstance)` 호출
- **After**: 컴포넌트에서 로컬 `mutations.tsx`의 래퍼 훅 호출 (Axios는 래퍼 내부에 캡슐화됨)

### 4.2 타입 정합성 (Single Source of Truth)
`apps/web` 내 개별 타입 정의를 제거하고 `@bookjeok/core`를 유일한 진실의 원천으로 사용합니다. 이를 통해 웹과 앱 사이의 타입 정의 불일치를 근본적으로 차단했습니다.
`apps/web` 내 개별 타입 정의와 로컬 래퍼를 제거하고 `@bookjeok/core`를 유일한 진실의 원천으로 사용합니다. 이를 통해 웹과 앱 사이의 타입 정의 불일치를 근본적으로 차단했습니다.

### 4.3 `any` 제거 및 Error Boundary 강화
- 모든 뮤테이션 에러 핸들러와 `onSuccess` 콜백에서 `any`를 제거하고 실젯 타입을 주입했습니다.
- 이를 통해 개발 환경에서 런타임 에러 가능성을 현격히 낮추었습니다.

## 5. Expo 앱 개발 가이드 (Next Steps)

현재 아키텍처는 Expo(React Native) 앱을 위한 완벽한 기반을 제공합니다.

1. **로직 공유**: `@bookjeok/react-query`, `@bookjeok/api-client`, `@bookjeok/core`를 즉시 임포트하여 사용하세요.
2. **클라이언트 주입**: Expo용 Axios 인스턴스(SecureStore 연동 등)를 생성한 뒤, 훅 호출 시 주입하면 됩니다.

---
**최종 상태**: 모노레포 리팩토링의 모든 기술적 부채와 타입 안정성 이슈가 해결되었습니다. 확장 가능한 클린 아키텍처가 전 피처에 100% 적용되었으며, Expo 모바일 앱 개발을 시작할 준비가 되었습니다.
