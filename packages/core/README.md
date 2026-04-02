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
// 반드시 @bookjeok/core 루트에서 가져와야 하며, 서브패스는 사용하지 않습니다.
import { formatPrice, type ApiResponse } from "@bookjeok/core";

const priceLabel = formatPrice(15000); // ₩15,000
```

## 🏗️ 개발 가이드 (Development)

1. **상대 경로 사용**: 패키지 내부 코드끼리 참조할 때는 반드시 **상대 경로**를 사용하세요. (예: `import { ... } from "../../shared/utils"`).
2. **Platform Agnostic**: 브라우저(`window`, `document`)나 Node.js(`fs`, `path`) 전용 API를 직접 참조하지 마세요. 필요시 인터페이스로 추상화하여 주입받아야 합니다.
3. **무결성 유지**: 이 패키지는 모든 앱의 뇌(Brain) 역할을 하므로, 파괴적인 변경 시 모든 앱(`web`, `server`, `native`)의 빌드 성공 여부를 확인해야 합니다.
