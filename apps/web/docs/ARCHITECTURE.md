# 🏗️ Frontend Component Architecture Guide

이 문서는 `bookjeok-front` 프로젝트의 컴포넌트 구조 원칙을 정의합니다.
새로운 기능을 개발하거나 리팩토링할 때, 모든 에이전트와 개발자는 이 규칙을 준수해야 합니다.

## 1. 핵심 철학: "Context-Based Grouping" (문맥 기반 그룹화)

우리는 단순히 컴포넌트의 기능(Button, Input)이 아니라, **"어디서, 어떻게 쓰이는가(Context)"**를 기준으로 폴더를 구조화합니다.
기존의 `components` 폴더에 수십 개의 파일이 플랫하게 나열되는 것을 방지하고, 관련된 컴포넌트끼리 강하게 응집되도록 합니다.

### ❌ 피해야 할 패턴 (Flat & Generic)

```
src/features/reading-log/components/
  ├── Calendar.tsx
  ├── CalendarHeader.tsx
  ├── CalendarDay.tsx
  ├── StatsChart.tsx
  ├── StatsList.tsx
  ├── LogItem.tsx
  └── ... (수십 개가 섞여 있음)
```

### ✅ 지향하는 패턴 (Context-Based)

```
src/features/reading-log/components/
  ├── calendar-view/       # "달력 뷰"라는 문맥
  │   ├── reading-log-calendar/
  │   └── calendar-header/
  ├── stats-view/          # "통계 뷰"라는 문맥
  │   ├── reading-log-stats/
  │   └── report-card/
  ├── list-view/           # "리스트 뷰"라는 문맥
  │   └── log-list/
  └── common/              # 해당 기능(Feature) 내에서 공통으로 쓰임
      └── log-input-modal/
```

---

## 2. Directory Structure Rules (폴더 구조 규칙)

`src/features/<feature-name>/components/` 하위는 반드시 **중간 분류(Context Directory)**를 거쳐야 합니다.

### 2.1 Context Directory Naming

- **View/Page 기반**: `list-view`, `detail-view`, `calendar-view`, `dashboard`
- **역할 기반**: `widgets` (작은 독립 UI), `forms` (입력 폼 집합), `charts` (데이터 시각화), `guards` (보안/인증)
- **공통/기타**: `common` (feature 전역 공통), `partials` (조각들)

### 2.2 Component Directory

- 각 컴포넌트는 자신의 폴더를 가집니다 (예: `user-profile/index.tsx`).
- 컴포넌트와 강하게 결합된 하위 컴포넌트, 스타일, 훅은 해당 컴포넌트 폴더 안에 위치시킵니다.

---

## 3. 예시 (Examples)

### Case A: `book-sale` (중고 거래)

- `sale-market/`: 팝니다 장터 메인 UI (필터, 리스트)
- `sale-detail/`: 판매글 상세 페이지 관련
- `sale-form/`: 판매글 등록/수정 폼
- `my-sales/`: 내 판매 내역 관리

### Case B: `chat` (채팅)

- `room/`: 채팅방 내부 (메시지 리스트, 입력창, 헤더)
- `list/`: 채팅 목록
- `widgets/`: 전역 채팅 위젯 (토글 버튼, 작은 창)

### Case C: `auth` (인증)

- `forms/`: 로그인 폼, 회원가입 폼
- `guards/`: `AuthGuard`, `GuestGuard`

---

## 5. 다국어 지원 (I18n Architecture)

`next-intl` 라이브러리를 기반으로 다국어를 지원합니다.

### 5.1 Directory Structure

- **`src/app/[locale]/`**: Next.js App Router의 Dynamic Route를 활용하여 모든 페이지를 `[locale]` 하위로 이동시켰습니다.
- **`src/shared/config/i18n/`**: 라우팅 설정(`routing.ts`) 및 요청 핸들러(`request.ts`)가 위치합니다.
- **`src/shared/i18n/messages/`**: `ko.json`, `en.json` 번역 파일이 위치합니다.

### 5.2 Usage Pattern

- **Component (Server/Client)**:

  ```tsx
  import { useTranslations } from "next-intl";

  const MyComponent = () => {
    const t = useTranslations("my-namespace");
    return <h1>{t("title")}</h1>;
  };
  ```

- **Translation Keys**: 번역 키는 기능(feature) 단위로 그룹화하여 `messages/*.json`에 정의합니다.
