# bookjeok (북적) - 책과 지식의 선순환 플랫폼

> **Modern Book Platform**  
> 책을 탐색하고, 기록하고, 소통하며, 가치를 나누는 도서 커뮤니티 플랫폼입니다.

---

## 🛠 Tech Stack

성능과 개발 생산성을 고려하여 최신 웹 기술을 도입했습니다. **Monorepo** 구조로 관리됩니다.

### **Core**

- **Monorepo**: [TurboRepo](https://turbo.build/) - 빌드 캐싱 및 병렬 실행
- **Package Manager**: [pnpm](https://pnpm.io/)

### **Frontend (`bookjeok-front`)**

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**:
  - **Server State**: [TanStack Query v5](https://tanstack.com/query/latest) (Optimistic Updates 구현)
  - **Client State**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) (Accessibility Focus), [Framer Motion](https://www.framer.com/motion/)

### **Backend (`bookjeok-back`)**

- **Framework**: [NestJS 11](https://nestjs.com/)
- **Architecture**: Layered Architecture (Controller - Service - Repository) 및 의존성 주입(DI) 활용
- **Database**: [PostgreSQL](https://www.postgresql.org/) & [TypeORM](https://typeorm.io/)
- **Validation**: `class-validator` 기반의 DTO 검증 및 Global Pipe 적용
- **Real-time**: [Socket.IO](https://socket.io/) Gateway를 활용한 양방향 통신
- **AI**: **Google Gemini** API 연동

### **DevOps & Infrastructure**

- **Container**: **Docker** (Multi-stage Build, Alpine Linux 기반 경량화)
- **Deployment**:
  - Frontend: Vercel
  - Backend: Koyeb (Container)

---

## ✨ Key Features & Technical Details

### 1. 📚 도서 탐색 (Book Discovery)

- **Naver Books API 연동**: 검색 속도 최적화 및 페이지네이션 구현
- **AI 도서 요약**: Google Gemini 프롬프트 엔지니어링을 통한 핵심 내용 3줄 요약 생성

### 2. ♻️ 중고 거래 (Marketplace)

- **ISBN 기반 자동 등록**: 바코드/검색으로 메타데이터 자동 완성, 사용자 입력 최소화
- **실시간 채팅**: Socket.IO Room 기능을 활용한 1:1 대화방 및 메시지 영구 저장
- **상태 관리**: TanStack Query의 `invalidateQueries`를 활용한 데이터 동기화

### 3. 📝 독서 기록 및 커뮤니티 (Social Reading)

- **리치 텍스트 에디터**: Tiptap 기반의 커스텀 에디터 구현 (이미지 업로드, 서식 적용)
- **캘린더 시각화**: 월별 독서량을 히트맵 형태로 시각화
- **반응형 디자인**: Mobile-First 접근 방식으로 모든 디바이스 최적화

### 4. 🎭 문화/예술 정보 (Culture)

- **KOPIS API 연동**: 공연예술통합전산망 데이터를 주기적으로 동기화하여 최신 정보 제공

---

## 📂 Project Structure

```bash
bookjeok-monorepo/
├── bookjeok-front/           # [Next.js 15] Frontend
│   ├── src/app/              # App Router (Page, Layout, Loading)
│   ├── src/features/         # 기능별 모듈 (Auth, Book, Chat...) - Co-location
│   ├── src/shared/           # 공통 UI(Button, Input) 및 유틸리티
│   ├── Dockerfile            # Standalone 모드 지원
│   └── ...
│
├── bookjeok-back/            # [NestJS 11] Backend
│   ├── src/features/         # 기능별 모듈 (Module, Controller, Service)
│   ├── src/shared/           # 공통 모듈 (Guard, Filter, Interceptor)
│   ├── Dockerfile            # Multi-stage Build 적용
│   └── ...
│
├── package.json              # Workspace Root
└── pnpm-workspace.yaml       # Workspace Configuration
```

---

## 🚀 Getting Started

이 프로젝트는 **Docker**를 통해 간편하게 실행하거나, 로컬 환경에서 **Node.js**로 직접 실행할 수 있습니다.

### Prerequisites

- Node.js v20+
- pnpm v9+
- PostgreSQL Database

### Option 1: Run with Docker (Recommended for Preview)

각 서비스 디렉토리에 최적화된 `Dockerfile`이 포함되어 있습니다.

```bash
# 백엔드 이미지 빌드
docker build -f bookjeok-back/Dockerfile -t bookjeok-back .

# 프론트엔드 이미지 빌드
docker build -f bookjeok-front/Dockerfile -t bookjeok-front .

# 컨테이너 실행
docker run -p 3000:3000 bookjeok-front
docker run -p 8080:3000 bookjeok-back
```

### Option 2: Run Locally (Development)

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/bookjeok.git

# 2. 의존성 설치 (Root)
pnpm install

# 3. 환경 변수 설정
# bookjeok-front/.env.local 및 bookjeok-back/.env 파일 생성

# 4. 전체 서비스 실행 (TurboRepo)
pnpm dev
```

---

## 📜 License

This project is licensed under the MIT License.
