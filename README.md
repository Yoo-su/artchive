# bookjeok (북적) - 책과 지식의 선순환 플랫폼

독서 기록장, 도서 리뷰 작성, 그리고 이웃과의 따뜻한 중고 도서 장터가 결합된 통합 도서 커뮤니티 플랫폼 서비스입니다.

---

## 🛠 Tech Stack

성능과 유연성을 위해 **Monorepo** 구조로 설계되었으며, 공유 패키지를 활용한 명시적 의존성 주입(Explicit DI) 아키텍처를 따릅니다.

### **Core**
- **Monorepo Manager**: [TurboRepo](https://turbo.build/) (빌드 캐싱 및 병렬 작업 최적화)
- **Package Manager**: [pnpm v10](https://pnpm.io/) (Workspace를 통한 패키지간 완벽 격리 및 코드 공유)
- **Refactoring Log**: [MONOREPO_REFACTORING_LOG.md](./MONOREPO_REFACTORING_LOG.md) (구조 개선 작업 상세 아카이브)

### **Frontend (`apps/web`)**
- **Framework**: Next.js 15 (App Router)
- **State Management**: Zustand (클라이언트 상태) & TanStack Query v5 (서버 상태 동기화)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI (웹 접근성), Framer Motion (애니메이션)

### **Backend (`apps/server`)**
- **Framework**: NestJS 11
- **Architecture**: Layered Architecture (Controller - Service - Repository)
- **Database**: PostgreSQL (RDBMS) & TypeORM (ORM)
- **Real-time**: Socket.IO Gateway (1:1 중고 거래 대화방)
- **AI**: Google Gemini API (AI 도서 핵심 3줄 요약)

### **DevOps & Deployment**
- **Frontend**: Vercel (Next.js Standalone 최적화 배포)
- **Backend**: Koyeb (Docker Container 기반 배포)

---

## 📂 Project Structure

```bash
bookjeok-monorepo/
├── apps/
│   ├── web/                  # [Next.js 15] 웹 프론트엔드 서비스 (@bookjeok/web)
│   │   ├── src/app/          # 라우팅 엔트리 (App Router)
│   │   ├── src/features/     # 도메인 단위 기능 UI 컴포넌트
│   │   └── src/shared/       # 전역 공용 컴포넌트, 스타일, 유틸
│   │
│   ├── server/               # [NestJS 11] 백엔드 API 서비스 (@bookjeok/server)
│   │   ├── src/features/     # 도메인 모듈 (Controller, Service, Entity)
│   │   └── src/shared/       # 가드, 필터, 인터셉터 등 공통 데코레이터
│   │
│   └── native/               # [Expo/React Native] 모바일 앱 서비스 (@bookjeok/native)
│
├── packages/                 # 공용 비즈니스 로직 및 라이브러리 (Shared Workspace)
│   ├── core/                 # 모든 플랫폼용 공통 타입, 상수, 유틸 (@bookjeok/core)
│   ├── api-client/           # Axios 기반 데이터 호출 핵심 엔진 (@bookjeok/api-client)
│   └── react-query/          # TanStack Query 공유 훅 및 캐싱 로직 (@bookjeok/react-query)
│
├── package.json              # Workspace Root 정의
└── pnpm-workspace.yaml       # 모노레포 패키지 경로 설정
```

---

## 🏛 Architecture: Explicit DI (명시적 의존성 주입)

북적의 웹과 모바일 앱(Expo) 프론트엔드는 `packages/` 내부의 동일한 데이터 처리 라이브러리를 공유합니다.
- 특정 전역 환경이나 Axios 인스턴스에 의존하는 대신, 함수나 훅 호출 시점에 각 플랫폼에 특화된 `AxiosInstance`를 인자로 직접 주입받습니다.
- 이로 인해 데이터 통신 및 핵심 비즈니스 로직은 **100% 코드를 공유**하며, 프레젠테이션(UI) 레이어만 기기에 맞게 분리 구현되는 극도의 재사용성을 보장합니다.

---

## 📜 License
This project is licensed under the MIT License.
