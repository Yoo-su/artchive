# 🛠️ @bookjeok/server (Backend)

북적의 백엔드 서버는 **NestJS 11**과 **TypeORM (PostgreSQL + pgvector)**을 기반으로 구축되었으며, 안정적인 데이터 관리와 실시간 WebSocket 통신, 그리고 RAG 기반 AI 기능을 제공합니다.

---

## 🚀 주요 기능 (Key Features)

### 1. 인증 및 보안 (Auth & Security)
- **JWT 이중 토큰 인증:** Access Token 및 Refresh Token 발급/검증 (`POST /auth/refresh`).
- **1회용 인증 티켓 교환 (OAuth Ticket Exchange):** 소셜 로그인 콜백 시 JWT를 브라우저 URL에 노출하지 않고 60초 일회용 티켓을 발급하여 `POST /auth/exchange`로 교환.
- **`tokenVersion` 기반 즉시 무효화:** 사용자 로그아웃 또는 계정 보안 이벤트 시 DB `tokenVersion`을 증가시켜 이전 Refresh Token을 즉시 만료.
- **Rate Limiting:** `@nestjs/throttler`를 활용한 무차별 대입 공격(Brute-Force) 방어.

### 2. 도서 검색 및 RAG 기반 AI 도서 추천 (Search & LLM)
- **Aladin Open API & 네이버 도서 연동:** 도서 메타데이터 자동 수집 및 캐싱.
- **3단계 RAG 파이프라인:**
  1. 의도 분류 (Gemini Flash Function Calling)
  2. `pgvector` 코사인 유사도 벡터 검색 (`gemini-embedding-001` 768차원 임베딩)
  3. RAG 합성 및 리랭킹 (맞춤 추천 이유 `reason` 생성)
- **SSE(Server-Sent Events) 스트리밍:** 실시간 대화형 도서 탐색 스트림 전송 (`/search/ai/chat/stream`).
- **AI 도서 3단 요약:** Gemini 모델을 통한 도서별 서사 분석 및 DB 캐싱.

### 3. 중고 도서 장터 및 실시간 채팅 (Used Book Sale & Chat)
- **중고 거래 CRUD:** 트랜잭션을 통한 도서 메타데이터 매핑 및 위치(지오코딩) 기반 판매글 관리.
- **Socket.IO 실시간 채팅:** 판매글별 1:1 채팅방 생성, 실시간 메시지 전송, 읽음 처리, 타이핑 상태 표시.

### 4. 독서 기록, 커뮤니티, 인사이트 (Reading Log, Review, Insights)
- **독서 캘린더 & 통계:** 월별 독서 기록 조회 및 사용자 독서 통계 집계.
- **리뷰 & 리액션:** 마크다운 에디터 호환 리뷰 CRUD 및 리액션(공감/인사이트/응원) 집계.
- **인사이트 대시보드:** 지역별/카테고리별 거래량, 가격 분포, 인기 태그 통계 연산.

---

## 📂 프로젝트 구조 (Structure)

```
src/
├── app.module.ts       # 루트 모듈
├── main.ts             # 엔트리포인트 (Swagger, CORS, ValidationPipe)
├── features/           # 도메인 모듈 (Controller - Service - Entity - DTO)
│   ├── auth            # JWT 인증, OAuth, 티켓 교환, Throttler
│   ├── book            # 도서 조회 및 외부 API 연동
│   ├── used-book-sale  # 중고책 판매글 관리
│   ├── search          # RAG 벡터 검색 및 SSE 스트림
│   ├── search-keyword  # 인기 검색어 실시간 집계
│   ├── chat            # Socket.IO WebSocket 게이트웨이 & 채팅방
│   ├── llm             # Gemini 임베딩 및 AI 도서 요약
│   ├── reading-log     # 독서 기록 및 라운지 피드
│   ├── review          # 도서 리뷰 및 리액션
│   ├── comment         # 도서/리뷰 댓글 시스템
│   ├── notification    # 사용자 알림
│   ├── user            # 사용자 프로필 & tokenVersion 관리
│   ├── wishlist        # 위시리스트
│   └── insights        # 서비스 전체 누적 통계 집계
└── shared/             # 전역 가드(JwtAuthGuard, RolesGuard), 필터, 인터셉터
```

---

## 🏗️ 개발 원칙 (Development Rules)

1. **DTO의 `@bookjeok/core` 계약 준수**: 모든 요청/응답 DTO는 `@bookjeok/core` 인터페이스를 `implements`하여 정의합니다.
2. **Entity 정보 은닉**: 비밀번호, `tokenVersion` 등 내부 컬럼은 DTO 반환 시 절대 외부에 노출하지 않습니다.
3. **트랜잭션 무결성**: 복수 엔티티의 변경이 수반되는 작업(도서 생성 + 판매글 등록 등)은 `QueryRunner` 또는 `DataSource.transaction`을 사용합니다.
