# bookjeok (북적) - 책과 지식의 선순환 플랫폼

> **독서 기록 관리, 대화형 AI 도서 큐레이션, 실시간 중고책 거래, 그리고 독자 커뮤니티가 결합된 통합 도서 플랫폼입니다.**  
> 멀티 플랫폼 확장성과 코드 재사용성을 극대화하기 위해 Monorepo 아키텍처 및 공유 패키지 기반으로 설계되었습니다.

---

## Key Features (주요 기능)

### 1. RAG 기반 대화형 AI 도서 큐레이션 (Vector Search & LLM)
- **자연어 대화형 추천**: 사용자의 기분, 고민, 구체적인 상황이나 독서 취향을 텍스트로 자유롭게 표현하여 도서를 추천받습니다.
- **768차원 임베딩 & pgvector 벡터 검색**: Google `gemini-embedding-001`을 통해 생성된 768차원 고차원 벡터와 PostgreSQL `pgvector` (IVFFlat/HNSW 인덱스) 기술을 결합하여 65,000권 이상의 도서 DB에서 세맨틱(의미론적) 유의성을 탐색합니다.
- **다단계 RAG 파이프라인**: 1차 LLM Agent (Function Calling 의도 분류) ➔ 2차 코사인 유사도 벡터 탐색 ➔ 3차 RAG 합성 (전체 큐레이션 서사 및 책별 개별 추천 이유 `reason` 생성) 과정을 거쳐 신속하게 추천을 서빙합니다.
- **사용자 세션 보안 및 데이터 격리**: 회원 전용 토큰 인증(@UseGuards)과 유저 ID별 `sessionStorage` 키 격리를 통해 계정 간 대화 기록 유출을 차단합니다.

### 2. 3D 모션 독서 카드 덱 & 소셜 공유 (`/share/deck`)
- **월별/연도별 독서 캘린더**: 내가 완독한 책과 한줄평, 감상문을 캘린더 형태로 기록합니다.
- **Framer Motion 3D 카드 덱**: 완독한 도서를 3D 인터랙티브 카드 덱 형태로 스와이프하며 뒤집어볼 수 있는 시각적 덱 뷰어를 제공합니다.
- **동적 OpenGraph 소셜 공유**: 연도별 독서 덱 공유 링크(`/share/deck/[handle]?year=YYYY`)를 통해 카카오톡, 트위터, 슬랙 공유 시 해당 유저의 닉네임과 완독 기록이 반영된 동적 OG 메타데이터 카드가 생성됩니다.

### 3. 위치 기반 중고 도서 마켓플레이스 & 1:1 실시간 채팅
- **지도 및 지역 필터링**: 카카오 맵 API 및 지오코딩을 활용하여 전국 시/도, 시/군/구 단위별 중고책 판매글을 검색하고 거래 희망 장소를 지도로 확인합니다.
- **실시간 1:1 채팅방**: Socket.IO 기반 백엔드 게이트웨이를 구축하여 구매자와 판매자 간 실시간 메시지 송수신 및 거래 약속 기능을 제공합니다.
- **판매 상태 관리**: 판매중 / 예약중 / 판매완료 상태 변경 및 나의 판매 내역 관리 기능을 제공합니다.

### 4. 커뮤니티 도서 리뷰 & 독서 라운지 (`lounge`)
- **풍부한 도서 리뷰**: 별점, 태그, 공개/비공개 설정이 가능한 리뷰 작성 및 마크다운 표현을 지원합니다.
- **독서 라운지 피드**: 다른 독자들이 실시간으로 남기는 독서 기록과 이웃 독자들의 읽는 책 목록을 둘러봅니다.
- **인사이트 & 서비스 통계 (`insights`)**: 지역별 중고 거래 분포, 가격대 분포, 사용된 태그 순위, 리액션 비율 등을 시각화하여 제공합니다.

---

## Tech Stack (기술 스택)

### **Core & Monorepo**
- **Monorepo Manager**: [Turborepo](https://turbo.build/) (빌드 캐싱 및 파이프라인 병렬화)
- **Package Manager**: [pnpm v10](https://pnpm.io/) (Workspace 패키지 완벽 격리 및 코드 공유)
- **Shared Packages**: `@bookjeok/core`, `@bookjeok/api-client`, `@bookjeok/react-query`

### **Frontend (`apps/web`)**
- **Framework**: Next.js 15 (App Router, Server Components, SSG/ISR)
- **State Management**: Zustand v5 (클라이언트 상태) & TanStack Query v5 (서버 상태 동기화 및 캐싱)
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **UI & Animations**: Radix UI, Framer Motion, Swiper.js, Lucide Icons
- **i18n**: `next-intl` (다국어 한국어/영어 지원)

### **Backend (`apps/server`)**
- **Framework**: NestJS 11
- **Database & ORM**: PostgreSQL, TypeORM, `pgvector` (Vector Database Extension)
- **AI & RAG Engine**: Google Gemini 3.6 Flash (`@google/genai`), `gemini-embedding-001`
- **Real-Time**: Socket.IO Gateway
- **Auth & Rate Limiting**: Passport JWT Auth Guard, `@nestjs/throttler`

### **DevOps & Infrastructure**
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Koyeb (Docker Container Deployment)
- **Database Hosting**: Supabase PostgreSQL

---

## Architecture & Design Patterns

### 1. Monorepo 기반 워크스페이스 구조 (`packages/`)
`packages/` 모듈에 도메인 모델과 통신 클라이언트를 집약하여 플랫폼 전반의 모듈 재사용성을 극대화했습니다.
- `@bookjeok/core`: 데이터 모델 인터페이스, DTO, API 경로 상수 통합 관리
- `@bookjeok/api-client`: 공개/인증 Axios 클라이언트 및 엔드포인트 호출 모듈 통합
- `@bookjeok/react-query`: TanStack Query 쿼리 키 팩토리 및 데이터 패칭 훅 공유

### 2. RAG & Vector Search 파이프라인 아키텍처
```
[사용자 메시지]
      │
      ▼
┌──────────────────────────────────────────────┐
│  NestJS SearchController (JWT Auth Guard)    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Gemini 3.6 Flash 1차 LLM Agent              │
│  (의도 분류 & search_books Function Calling) │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  EmbeddingService (gemini-embedding-001)     │
│  768차원 L2 정규화 벡터 생성                 │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Supabase PostgreSQL pgvector                │
│  RPC match_books (코사인 유사도 검색)       │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Gemini 3.6 Flash 2차 RAG 합성               │
│  (전체 큐레이션 메시지 + 책별 reason 생성)   │
└──────────────────────────────────────────────┘
```

---

## Project Structure (프로젝트 구조)

```bash
bookjeok-monorepo/
├── apps/
│   ├── web/                  # [Next.js 15] 웹 프론트엔드 서비스 (@bookjeok/web)
│   │   ├── src/app/          # 라우팅 엔트리 & SEO Metadata (App Router)
│   │   ├── src/features/     # 도메인 단위 기능 UI 컴포넌트 & Custom Hooks
│   │   ├── src/views/        # 페이지 뷰 레이어 컴포넌트
│   │   └── src/shared/       # 전역 공용 컴포넌트, 스타일, 유틸
│   │
│   ├── server/               # [NestJS 11] 백엔드 API 서비스 (@bookjeok/server)
│   │   ├── src/features/     # 도메인 모듈 (Search, User, Review, Sale, LLM)
│   │   └── src/shared/       # 가드, 인터셉터, 커스텀 데코레이터
│   │
│   └── native/               # [Expo/React Native] 모바일 앱 서비스 (@bookjeok/native)
│
├── packages/                 # 공용 비즈니스 로직 및 워크스페이스 라이브러리
│   ├── core/                 # 공통 타입, DTO, API 경로 상수 (@bookjeok/core)
│   ├── api-client/           # Axios 기반 API 통신 핵심 엔진 (@bookjeok/api-client)
│   └── react-query/          # TanStack Query 키 팩토리 및 공유 훅 (@bookjeok/react-query)
│
├── package.json              # Workspace Root 정의
└── pnpm-workspace.yaml       # 모노레포 패키지 경로 설정
```

---

## Security & Performance Optimizations

- **JWT 토큰 자동 갱신**: Axios 인터셉터를 통한 Access Token 만료 감지 및 Silent Refresh Token 갱신 처리.
- **Throttler Rate Limiting**: AI 검색 및 주요 API 엔드포인트에 단위시간당 호출 제한 적용으로 서버 자원 보호.
- **이미지 최적화**: Cloudinary 및 Vercel Blob Storage 기반 외부 이미지 도메인 보안 패턴 적용.

---

## License
This project is licensed under the MIT License.
