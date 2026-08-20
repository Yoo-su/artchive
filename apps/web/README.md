# 📚 @bookjeok/web (Frontend)

**Next.js 15 (App Router) & React 19** 기반의 북적 사용자 웹 서비스입니다.
문화 예술 정보 탐색, 중고 서적 거래, 실시간 채팅, RAG 기반 AI 도서 추천 등 다양한 기능을 고성능 반응형 UI/UX로 제공합니다.

---

## 🚀 주요 기능 (Key Features)

- **🎨 모던 UI/UX & 애니메이션**: Tailwind CSS v4, Radix UI, Framer Motion을 결합한 반응형 인터랙티브 인터페이스.
- **⚡ 데이터 페칭 & 캐싱**: TanStack Query v5 기반 Optimistic Updates, 무한 스크롤, Server-side Prefetching.
- **🤖 대화형 AI 도서 탐색 (SSE)**: EventSource / Fetch 스트림 기반의 실시간 AI 도서 추천 챗봇.
- **🔒 크로스 도메인 보안 인증**:
  - 소셜 로그인 시 1회용 인증 티켓(Ticket Exchange) 방식으로 안전한 JWT 수신
  - Axios 인터셉터 기반 Silent Access Token Refresh
  - 인증 만료 시 안전한 로그인 리다이렉트 및 라우트 보호 가드(`UserProvider`)
- **💬 실시간 소통**: Socket.IO 기반 실시간 1:1 중고거래 채팅 및 타이핑 인디케이터.
- **🌍 다국어 지원 & SEO**: `next-intl` (한국어/영어), dynamic canonical, hreflang alternates 및 표준 Sitemap.

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 스택 |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router), React 19 |
| **Language** | TypeScript |
| **State & Data** | TanStack Query v5 (`@bookjeok/react-query`), Zustand v5 |
| **API Client** | `@bookjeok/api-client`, `@bookjeok/core` |
| **Styling** | Tailwind CSS v4, Radix UI (Headless), Lucide React |
| **Animation** | Framer Motion |
| **Editor** | Tiptap (Rich Text Editor) |
| **Realtime** | Socket.IO Client |

---

## 📂 프로젝트 구조 (Structure)

```
src/
├── app/                  # Next.js App Router (다국어 라우트 [locale], 메타데이터)
├── views/                # 페이지 단위 조립 뷰 레이어 ([feature]-view/)
├── features/             # 도메인별 기능 UI 컴포넌트 & 상태 관리
│   ├── auth/             # 로그인, 회원가입, 소셜 콜백 처리
│   ├── book/             # 도서 검색, 상세 정보, AI 추천 슬라이더
│   ├── book-sale/        # 중고 도서 등록 폼, 마켓 목록
│   ├── chat/             # 1:1 실시간 채팅방 컴포넌트
│   ├── reading-log/      # 독서 캘린더, 라운지 피드, 3D 덱 뷰어
│   ├── review/           # Tiptap 리뷰 에디터 및 리액션
│   └── user/             # 프로필 관리, 위시리스트
├── shared/               # 전역 공용 컴포넌트, 프로바이더, 유틸
│   ├── components/       # Radix UI 기반 공용 UI
│   ├── providers/        # QueryProvider, UserProvider, ChatProvider
│   └── utils/            # 전역 유틸리티 (포맷터, 고유 파일명 생성 등)
└── layouts/              # DefaultLayout, Header, Navigation
```

---

## 🏗️ 개발 원칙 (Development Rules)

1. **로컬 중복 타입 금지**: 도메인 데이터 타입은 반드시 `@bookjeok/core`에서 직접 임포트합니다.
2. **API 및 쿼리 훅 연동**: 데이터 통신은 `@bookjeok/react-query` 및 `@bookjeok/api-client`를 활용합니다.
3. **컴포넌트 문맥화**: `src/features/[feature]/components/` 하위는 `list-view/`, `detail-view/`, `forms/`, `common/` 등 문맥 기반 폴더로 그룹화합니다.
