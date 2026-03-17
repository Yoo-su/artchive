# 📚 bookjeok Frontend

**Next.js 15 & React 19** 기반의 모던 웹 애플리케이션 프론트엔드입니다.
문화 예술 정보 탐색, 중고 서적 거래, 실시간 채팅, AI 도서 추천 등 다양한 기능을 사용자 친화적인 UI/UX로 제공합니다.

---

## 🚀 주요 기능 (Key Features)

- **🎨 현대적인 UI/UX**: Tailwind CSS v4와 Radix UI, Framer Motion을 활용한 미려한 디자인과 애니메이션.
- **⚡ 성능 최적화**: TanStack Query의 Optimistic Updates, ISR, Server-side Prefetching을 통한 빠른 응답성.
- **🤖 AI 통합**: Google Gemini 기반의 도서 요약 및 취향 탐색기(Taste Finder).
- **🔒 보안**: HttpOnly Cookie 기반의 JWT 인증 시스템으로 XSS 방지.
- **💬 실시간 소통**: Socket.IO 기반의 실시간 채팅 및 알림 시스템.
- **🌍 다국어 지원**: `next-intl`을 활용한 한국어/영어 완벽 지원 및 SEO 친화적 URL 구조.

---

## 🛠️ 기술 스택 (Tech Stack)

### Core

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Library**: [React 19](https://react.dev/)

### State Management

- **Server**: [TanStack Query v5](https://tanstack.com/query/latest) (Infinite Scroll, Optimistic UI)
- **Client**: [Zustand](https://github.com/pmndrs/zustand) (Global UI State)

### Styling & UI

- **CSS**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/) (Headless), [Lucide React](https://lucide.dev/) (Icons)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Editor**: [Tiptap](https://tiptap.dev/) (Rich Text Editor)

### Deployment

- **Docker**: Standalone output mode optimization
- **Vercel**: Edge Network deployment

---

## 🏗️ 프로젝트 구조 (Structure)

도메인 주도 설계(DDD)의 아이디어를 차용하여 **Feature-Sliced** 구조를 따릅니다.

```bash
src
├── app/                  # Next.js App Router (Pages, Layouts)
├── features/             # 비즈니스 로직 및 상태 (Auth, Book, Chat...)
│   ├── auth/
│   ├── book/
│   └── ...
├── shared/               # 공용 컴포넌트 및 유틸리티
│   ├── ui/               # 버튼, 입력창 등 공용 UI
│   ├── lib/              # 유틸리티 함수
│   └── config/           # 환경 변수 및 설정
└── styles/               # 전역 스타일 및 Tailwind 설정
```

---

## 🚦 시작하기 (Getting Started)

### 요구 사항

- Node.js v20+
- pnpm v9+

### 1. 설치 (Installation)

```bash
pnpm install
```

### 2. 환경 변수 설정 (.env)

루트 디렉토리에 `.env.local` 파일을 생성합니다.

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# External APIs (필요 시)
NEXT_PUBLIC_NAVER_CLIENT_ID=...
```

### 3. 실행 (Running)

#### 로컬 개발 (Local Dev)

```bash
pnpm dev
```

#### Docker 실행 (Production Preview)

```bash
# Standalone 모드로 빌드된 최적화 이미지 실행
docker build -t bookjeok-front .
docker run -p 3000:3000 bookjeok-front
```

---

## 💡 기술적 특징 (Highlights)

### 1. 🧠 Headless Component 기반 아키텍처 도입
- 복잡한 비즈니스 로직(예: 이미지 파일 관리, 최대 허용 개수 검증 등)을 `UI 렌더링`과 분리하여 `useImageUpload` 같은 순수 Custom Hook으로 분리(Headless)했습니다.
- 이를 통해 UI 재사용성과 로직 테스트 용이성을 극대화하고, 다양한 화면 컴포넌트(`ImageUploader`, `ProfileImageUploader` 등)에서 핵심 로직 패키지를 손쉽게 공유할 수 있습니다.

### 2. 서버/클라이언트 상태 분리

- **TanStack Query**는 서버 데이터(캐싱, 동기화)를 전담하고, **Zustand**는 UI 상태(모달 열림 등)만 관리하여 복잡도를 낮췄습니다.

### 2. 보안 강화 (HttpOnly Cookie)

- Access Token을 브라우저 JS가 접근할 수 없는 `HttpOnly` 쿠키에 저장하여 XSS 공격을 방지합니다.

### 3. AI 취향 탐색기

- 정형화된 검색이 아닌, AI와의 대화를 통해 내 취향에 맞는 책을 찾아주는 새로운 경험을 제공합니다. (RAG 패턴 활용)
