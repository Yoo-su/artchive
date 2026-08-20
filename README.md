# bookjeok (북적)

**책과 지식의 선순환 플랫폼**

> AI 기반 도서 추천·요약, 키워드 도서 검색, 독서 기록 관리, 실시간 중고책 거래, 도서 리뷰, 독자 커뮤니티가 결합된 통합 도서 플랫폼.

[![Live Demo](https://img.shields.io/badge/Live-bookjeok.com-4f46e5?style=flat-square)](https://bookjeok.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-f69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io)

---

## Features

### 키워드 기반 도서 검색
네이버 도서 API와 연동하여 제목·저자·출판사 등 다양한 조건으로 도서를 검색합니다. TanStack Query 기반 무한 스크롤로 검색 결과를 점진적으로 탐색하며, 사용자 검색어는 별도로 기록되어 최근 3일 기준 인기 검색어 순위를 실시간으로 집계합니다.

---

### RAG 기반 AI 도서 추천
사용자가 "주말에 가볍게 읽을 만한 에세이 찾고 있어요" 같은 자연어를 입력하면, 도서 DB에서 의미론적 유사도를 기반으로 도서를 찾아 추천합니다.

도서 메타데이터(제목·저자·줄거리·장르)를 결합한 텍스트를 Google `gemini-embedding-001` 모델로 768차원 벡터로 변환하여 PostgreSQL `pgvector`에 저장하는 사전 임베딩 작업을 거칩니다. 검색 시점에는 사용자의 질문도 동일한 모델로 임베딩한 뒤, 코사인 유사도 기반 벡터 검색(IVFFlat/HNSW 인덱스)으로 후보 도서를 추출합니다.

#### 3단계 RAG 파이프라인
1. **의도 분류 (1차 LLM)** — Gemini Flash에 Function Calling 도구(`search_books`)를 등록하여, 사용자의 발화가 실제 도서 검색 요청인지 단순 대화인지를 판단합니다. 단순 인사나 모호한 표현에는 꼬리 질문으로 대화를 이어가고, 구체적 독서 의도가 감지될 때만 검색 쿼리를 생성합니다.
2. **벡터 검색 (pgvector)** — 생성된 검색 쿼리를 768차원으로 임베딩하고 L2 정규화한 뒤, `match_books` RPC 함수를 호출하여 코사인 유사도 상위 25건의 후보 도서를 추출합니다. 유사도 임계값(0.35) 미만은 사전 필터링합니다.
3. **RAG 합성 & 리랭킹 (2차 LLM)** — 후보 도서 목록과 대화 맥락을 함께 넘겨, 사용자의 독자층·장르·분위기에 실제로 부합하는 도서만 엄선합니다. 최종적으로 전체 추천 서두 메시지와 책별 개별 추천 사유(`reason`)를 JSON 구조로 생성하여 반환합니다.

```
사용자 메시지
      │
      ▼
┌──────────────────────────────────────────────┐
│  1차 LLM Agent — 의도 분류                    │
│  Gemini Flash + Function Calling             │
│  search_books 도구 호출 여부 판단             │
└──────────────────┬───────────────────────────┘
                   │ searchQuery 생성
                   ▼
┌──────────────────────────────────────────────┐
│  EmbeddingService                            │
│  gemini-embedding-001 → 768차원 벡터 생성     │
│  L2 정규화                                    │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  pgvector 코사인 유사도 검색                  │
│  match_books RPC (상위 25건 후보 추출)        │
│  유사도 임계값 0.35 사전 필터링                │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  2차 LLM — RAG 합성 & 리랭킹                 │
│  대화 맥락 + 후보 도서 → 최종 추천 엄선       │
│  추천 서두 메시지 + 책별 개별 reason 생성      │
└──────────────────────────────────────────────┘
```

---

### AI 도서 핵심 요약
도서 상세 페이지에서 Gemini에 제목·저자·줄거리·출판사 정보를 전달하여, 단순 소개글과 차별화된 분석적 요약을 생성합니다.
- **summary** — 책의 고유한 서사적 갈등과 핵심 사건을 담은 250~350자 완성형 문단
- **keyPoints** — 핵심 인사이트 3가지
- **targetAudience** — 이 책이 필요한 독자의 구체적 상황이나 고민
- **keywords** — 연관 태그 5개

생성된 요약은 ISBN 기준으로 DB에 캐싱하여 동일 도서에 대한 반복 API 호출을 방지합니다. 모든 AI 요청은 토큰 사용량, 응답 지연시간, 성공/실패 여부를 별도 로그 테이블에 기록합니다.

---

### 독서 라운지 & 커뮤니티
독서 라운지(`/lounge`)에서 다른 독자들의 실시간 독서 기록과 읽고 있는 책 목록을 둘러봅니다. 인사이트(`/insights`) 페이지에서는 지역별 중고 거래 분포, 가격대 분포, 인기 태그 순위, 리액션 비율 등 서비스 전체의 독서 데이터를 시각화합니다.

---

### 중고책 마켓플레이스
카카오 맵 API 및 지오코딩을 활용한 위치 기반 중고책 거래 플랫폼입니다. 시/도, 시/군/구 단위 필터링과 지도 기반 거래 장소 확인이 가능합니다. Socket.IO 기반 실시간 1:1 채팅으로 구매자-판매자 간 대화 및 거래 약속을 처리하며, 판매중·예약중·판매완료 상태 관리를 지원합니다.

---

### 도서 리뷰 & 독서 기록
별점, 태그, 공개/비공개 설정이 가능한 도서 리뷰를 작성하고 마크다운 표현을 지원합니다. 월별/연도별 독서 캘린더에 완독한 책과 한줄평, 감상문을 기록하며, Framer Motion 기반 3D 카드 덱 뷰어로 완독 기록을 인터랙티브하게 탐색할 수 있습니다.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Monorepo** | Turborepo, pnpm v10 Workspaces |
| **Frontend (Web)** | Next.js 15 (App Router, RSC, SSG/ISR), Zustand v5, TanStack Query v5, Tailwind CSS v4, Radix UI, Framer Motion, next-intl (ko/en) |
| **Frontend (Admin)** | Next.js 15 (App Router), Lucide React, On-Demand ISR Revalidation Dashboard, Moderation Table |
| **Backend** | NestJS 11, TypeORM, PostgreSQL + pgvector, Google Gemini Flash + gemini-embedding-001, Socket.IO, Passport JWT, @nestjs/throttler |
| **Infra** | Vercel (Frontend), Koyeb (Backend Docker), Supabase PostgreSQL |

---

## Shared Packages

Monorepo `packages/` 디렉토리에 도메인 모델과 통신 클라이언트를 집약하여 플랫폼 전반의 코드 재사용성을 극대화했습니다.

| Package | Role |
|---|---|
| `@bookjeok/core` | 데이터 모델 인터페이스, API 경로 상수, 포맷터, 쿼리 키 (런타임 0B 순수 TS 계약) |
| `@bookjeok/api-client` | Axios 클라이언트(`publicApiClient`, `privateApiClient`), 토큰 인터셉터, API 호출 모듈 |
| `@bookjeok/react-query` | TanStack Query 쿼리 키 팩토리 및 데이터 페칭/뮤테이션 훅 |

---

## Project Structure

```
bookjeok/
├── apps/
│   ├── web/                  # Next.js 15 사용자 웹 프론트엔드
│   │   ├── src/app/          # App Router 라우팅 & 다국어 ([locale])
│   │   ├── src/features/     # 도메인 단위 기능 UI & 상태 관리
│   │   ├── src/views/        # 페이지 뷰 조립 레이어
│   │   └── src/shared/       # 전역 공용 컴포넌트, 스타일, 유틸
│   │
│   ├── admin/                # Next.js 15 관리자 포털
│   │   ├── src/app/          # 관리자 대시보드, 판매/리뷰 검수, ISR 캐시 제어
│   │   └── src/stores/       # 관리자 인증 상태 관리
│   │
│   └── server/               # NestJS 11 백엔드 API
│       ├── src/features/     # 도메인 모듈 (Search, LLM, User, Review, Sale, Chat 등)
│       └── src/shared/       # 가드(JwtAuthGuard, RolesGuard), 필터, 인터셉터
│
├── packages/
│   ├── core/                 # @bookjeok/core (도메인 타입, DTO 인터페이스, 상수)
│   ├── api-client/           # @bookjeok/api-client (Axios API 통신 엔진)
│   └── react-query/          # @bookjeok/react-query (TanStack Query 훅)
│
├── turbo.json
├── pnpm-workspace.yaml
└── project_guidelines.md     # 상세 개발자 온보딩 & 컨벤션 가이드
```

---

## Security & Architecture

- **1회용 인증 티켓 (Social Login Ticket Exchange)** — 소셜 로그인 리다이렉트 시 JWT를 URL에 노출하지 않고 60초 일회용 티켓을 발급하여 `POST /auth/exchange`로 안전하게 교환
- **JWT Silent Refresh** — Axios 인터셉터를 통한 Access Token 만료 감지 및 자동 갱신
- **`tokenVersion` 기반 즉시 무효화** — 로그아웃 또는 비정상 세션 감지 시 `user.tokenVersion`을 증가시켜 Refresh Token을 즉시 무효화
- **Rate Limiting (Brute-Force 방어)** — 로그인/회원가입/인증교환 엔드포인트 및 AI 검색에 Throttler 기반 호출 제한 적용
- **AI 요약 캐싱** — ISBN별 DB 캐싱으로 동일 도서 반복 LLM 호출 방지
- **AI 사용 로깅** — 모든 AI 요청의 토큰 사용량, 지연시간, 성공/실패 로그 기록

---

## Getting Started

```bash
# 1. 의존성 설치
pnpm install

# 2. 공용 패키지 빌드
pnpm --filter @bookjeok/core build
pnpm --filter @bookjeok/api-client build

# 3. 개발 서버 실행
pnpm dev:web      # 사용자 웹 (http://localhost:3000)
pnpm dev:server   # 백엔드 서버 (http://localhost:4000)
pnpm dev:admin    # 관리자 포털 (http://localhost:3001)

# 4. 전체 검증 (타입 체크 & 테스트)
pnpm --filter @bookjeok/server exec tsc --noEmit
pnpm --filter @bookjeok/web exec tsc --noEmit
pnpm --filter @bookjeok/admin exec tsc --noEmit
pnpm --filter @bookjeok/server test
pnpm --filter @bookjeok/web test
pnpm --filter @bookjeok/api-client test
```

전체 환경 변수 설정은 [.env.example](.env.example) 및 [project_guidelines.md](project_guidelines.md)를 참고하세요.

---

## License

This project is licensed under the [MIT License](LICENSE).
