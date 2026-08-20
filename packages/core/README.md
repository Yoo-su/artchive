# @bookjeok/core

북적 플랫폼 전체(Web, Admin, Server)에서 공유되는 순수 도메인 타입, DTO 인터페이스, API 경로 상수 및 포맷팅 유틸리티 패키지입니다.

---

## 📦 구성 요소

### 1. 도메인 타입 (`src/features/*/types.ts`)
- **13개 핵심 도메인 완비**: `art`, `auth`, `book`, `book-sale`, `chat`, `comment`, `insights`, `intro`, `llm`, `notification`, `reading-log`, `review`, `user`
- **단일 진실 공급원(SSOT)**: 모든 요청 파라미터(`Params`), 응답 구조(`Response`), 공용 엔티티 모양 정의

### 2. 상수 및 쿼리 키 (`src/shared/constants`, `src/features/*/constants.ts`)
- **API Paths (`API_PATHS`)**: 백엔드 REST API 엔드포인트 경로 상수
- **Query Key Factories (`bookKeys`, `reviewKeys` 등)**: React Query 캐시 키 표준화

### 3. 순수 유틸리티 (`src/shared/utils`)
- **Format**: `formatPrice` (통화 포맷팅), `formatAladinCoverImage` (도서 표지 고화질화)
- **Date**: `getSimpleDate`, `formatPostDate` (상대 시간 포맷팅)

---

## 🚀 사용법

```typescript
import { formatPrice, bookKeys, type UsedBookSale, API_PATHS } from "@bookjeok/core";

const formatted = formatPrice(15000); // ₩15,000
```

---

## 🏗️ 개발 가이드 (Development)

1. **런타임 오염 0B (Platform Agnostic)**: 브라우저(`window`, `document`)나 Node.js(`fs`, `path`) 전용 라이브러리를 임포트하지 마세요. 순수 TypeScript 인터페이스/함수만 작성합니다.
2. **NestJS DTO와의 연동**: 서버의 DTO 클래스가 코어 인터페이스를 `implements`하여 컴파일 타임 일관성을 보장합니다.
3. **변경 시 영향 검증**: 코어 패키지 수정 후 반드시 `pnpm --filter @bookjeok/core build`를 실행하고 Server/Web/Admin의 타입 체크를 통과해야 합니다.
