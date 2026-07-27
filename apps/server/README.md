# 🛠️ @bookjeok/server (Backend)

bookjeok의 백엔드 서버는 **NestJS 11**을 기반으로 구축되었으며, 안정적인 데이터 관리와 실시간 통신, 그리고 AI 기능을 제공합니다.
소셜 로그인부터 중고 서적 거래, 실시간 채팅, 그리고 LLM 기반 도서 요약까지 다양한 기능을 지원합니다.

## 주요 기능 (Key Features)

### 1. 인증 (Auth)

- **JWT 기반 인증:** Access Token과 Refresh Token을 사용한 이중 토큰 인증 시스템. (HttpOnly Cookie)
- **소셜 로그인:** Kakao, Naver OAuth2.0 지원.
- **가드 (Guards):** `JwtAuthGuard`, `RolesGuard` 등을 통한 철저한 라우트 보호.

### 2. 도서 및 중고 거래 (Book & Marketplace)

- **도서 정보 관리:** Aladin Open API를 통해 도서 정보를 자동으로 가져오고 DB에 캐싱합니다.
- **중고 거래:** 사용자가 소장한 도서를 판매 등록하고 관리(CRUD)할 수 있습니다.
- **트랜잭션:** 판매글 생성 시 도서 정보 등록과 판매글 등록을 하나의 트랜잭션으로 처리하여 데이터 무결성을 보장합니다.

### 3. 실시간 채팅 (Real-time Chat)

- **Socket.IO:** 웹소켓을 활용한 1:1 실시간 채팅.
- **채팅방 관리:** 판매글별 채팅방 생성, 메시지 영구 저장, 읽음 처리.

### 4. AI 도서 요약 (LLM)

- **Google Gemini Pro:** 최신 Gemini 1.5 Pro 모델을 활용한 도서 3줄 요약 기능.
- **프롬프트 엔지니어링:** 최적화된 시스템 프롬프트를 통해 일관성 있는 요약 제공.
- **AI 취향 탐색기 지원:** 프론트엔드의 취향 탐색 기능을 위한 백엔드 로직 지원.

### 5. 커뮤니티 (Review & Comment)

- **리뷰 및 리액션:** Tiptap 에디터 호환 리뷰 데이터 처리, 다양한 리액션(좋아요 등) 집계.
- **댓글:** 계층형 댓글 구조 지원 및 실시간 알림 연동.

### 6. 독서 기록 및 인사이트 (Log & Insights)

- **독서 캘린더:** 월별 독서 기록 조회 및 통계 API.
- **데이터 시각화 API:** 판매 현황, 독서 습관 등을 시각화하기 위한 집계 데이터 제공.

## 프로젝트 구조 (Structure)

`Module` 기반의 모듈러 아키텍처를 따르며, `Controller`, `Service`, `Repository` 계층으로 명확히 분리되어 있습니다.

```bash
src
├── app.module.ts       # 루트 모듈
├── main.ts             # 애플리케이션 진입점 (Server Instance)
├── features            # 도메인별 기능 모듈 (Controller - Service - Repository)
│   ├── auth            # 인증 및 세션 관리
│   ├── book            # 도서 정보 및 판매 게시물
│   ├── chat            # 실시간 소통 인프라 (Socket.IO)
│   ├── llm             # AI 도서 요약 엔진 (Google Gemini)
│   └── insight         # 데이터 시각화 및 통계용 연산 로직
└── shared              # 플랫폼 공용 필터, 가드, 데코레이터
```

## 시작하기 (Getting Started)

### 요구 사항

- Node.js v20+
- pnpm v9+
- PostgreSQL
- Docker (선택 사항)

### 1. 설치 (Installation)

```bash
# 의존성 설치 (Root에서 실행 권장)
pnpm install
```

### 2. 환경 변수 설정 (.env)

`apps/server` (또는 루트 `.env` 사용 시 경로 주의) 내에 `.env` 파일을 생성합니다.

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_user
DB_PASSWORD=your_password
DB_DATABASE=bookjeok

# JWT
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret

# OAuth & API Keys
KAKAO_CLIENT_ID=...
NAVER_CLIENT_ID=...
GEMINI_API_KEY=...
```

### 3. 실행 (Running the app)

#### Docker 사용 (추천)

최적화된 Docker 이미지를 통해 DB 설정 없이도 바로 실행할 수 있습니다 (DB는 별도 실행 필요).

```bash
# 이미지 빌드
docker build -t bookjeok-server .

# 컨테이너 실행
docker run -d -p 8080:8080 --env-file .env --name bookjeok-server bookjeok-server
```

#### 로컬 실행 (Local)

```bash
# 개발 모드
pnpm start:dev

# 프로덕션 빌드 및 실행
pnpm build
pnpm start:prod
```

## 테스트 (Test)

```bash
# 단위 테스트
pnpm test

# E2E 테스트
pnpm test:e2e
```
