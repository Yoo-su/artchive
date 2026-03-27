# @bookjeok/core

북적 플랫폼 전체(Web, Mobile, Server)에서 공유되는 핵심 타입, 상수 및 순수 유틸리티 패키지입니다.

## 📦 구성 요소

### 1. Types (`src/shared/types`, `src/features/*/types`)
- **API 규격**: `ApiResponse`, `PaginatedResponse` 등 공통 통신 규격 정의.
- **도메인 모델**: 도서, 유저, 리뷰, 커뮤니티 등 서비스 전반의 데이터 타입 정의.

### 2. Utils (`src/shared/utils`)
- **Date**: `getSimpleDate`, `formatPostDate` (상대 시간 포맷팅) 등 날짜 관련 순수 함수.
- **Format**: `formatPrice` (통화 포맷팅) 등 비즈니스 로직 유틸리티.

### 3. Constants (`src/shared/constants`)
- **API Paths**: 백엔드 엔드포인트 경로 정의.
- **Cache Keys**: React Query 등에 사용되는 쿼리 키 정의.

## 🚀 사용법

```typescript
import { formatPrice, ApiResponse } from "@bookjeok/core";

const priceLabel = formatPrice(15000); // ₩15,000
```

## ⚠️ 주의사항
- 이 패키지는 **Platform Agnostic** 해야 합니다.
- 브라우저 전용 API(window, document)나 Node.js 전용 API(fs, path)를 직접 참조하지 마세요.
