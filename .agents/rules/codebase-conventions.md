# 북적(bookjeok) 코드베이스 컨벤션

> 이 문서는 실제 코드에서 추출한 패턴과 규칙입니다.
> 새 기능을 만들 때 반드시 기존 코드의 패턴을 따라야 합니다.

---

## 1. 모노레포 구조 & 의존성 방향

```
packages/core       → 순수 타입, 상수, 유틸 (런타임 의존성 0)
packages/api-client → Axios 래퍼 (core에 의존)
packages/react-query → TanStack Query 훅 (core, api-client에 의존)
apps/server         → NestJS 11 + TypeORM + PostgreSQL
apps/web            → Next.js 15 App Router (react-query, api-client, core에 의존)
apps/admin          → Next.js 15 App Router
```

**의존성 흐름은 단방향**: `core → api-client → react-query → web/admin`. 역방향 import 금지.

---

## 2. 신규 기능 개발 순서 (Contract-First)

반드시 이 순서를 따름:

1. `packages/core` — 인터페이스, enum, API 경로 상수, 쿼리 키 팩토리
2. `apps/server` — Entity, DTO(`implements` 코어 인터페이스), Service, Controller
3. `packages/api-client` — API 호출 함수
4. `packages/react-query` — useQuery/useMutation 훅
5. `apps/web` — UI 컴포넌트

---

## 3. `@bookjeok/core` 패턴

### 3-1. API 경로 상수
**파일**: `packages/core/src/shared/constants/apis.ts`

```typescript
// API_PATHS 객체에 도메인별 섹션으로 추가
export const API_PATHS = {
  book: {
    sales: "/book/sales",
    saleDetail: (saleId: string) => `/book/sales/${saleId}`,
    // ...
  },
  chat: {
    rooms: "/chat/rooms",
    room: (roomId: number) => `/chat/rooms/${roomId}`,
    // ...
  },
  // 새 도메인 추가 시 여기에 섹션 추가
};
```

**규칙**: 하드코딩된 API 경로 절대 금지. 항상 `API_PATHS.xxx.yyy` 사용.

### 3-2. 타입 정의
**파일**: `packages/core/src/features/[feature]/types.ts`

- 서버 Entity와 별도로, **프론트에 노출할 인터페이스만** 정의
- enum은 서버와 동일한 값을 사용하되 core에서 정의
- 예: core의 `SaleStatus`에 `WITHDRAWN` 없음 (서버 전용 상태)

```typescript
// core에 정의하는 것: 프론트에서 사용할 인터페이스
export interface UsedBookSale {
  id: number;
  title: string;
  // ...서버가 응답으로 보내는 형태 그대로
}

// core에 정의하는 것: 요청 파라미터
export interface CreateBookSaleParams {
  title: string;
  price: number;
  // ...
}
```

### 3-3. 쿼리 키 팩토리
**파일**: `packages/core/src/features/[feature]/query-keys.ts`

```typescript
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const bookSaleKeys = createQueryKeys("bookSale", {
  marketSales: (params: SearchBookSalesParams) => ({
    queryKey: ["market", params],
  }),
  mySales: null, // 파라미터 없는 경우
  saleDetail: (saleId: string) => ({
    queryKey: [saleId],
  }),
});
```

**규칙**: `@lukemorales/query-key-factory` 사용. 직접 문자열 배열 금지.

### 3-4. 캐시 시간 상수
**파일**: `packages/core/src/shared/constants/cache.ts`

```typescript
export const CACHE_TIME = {
  THIRTY_SECONDS: 30 * 1000,   // 개인 데이터
  ONE_MINUTE: 60 * 1000,        // 자주 변하는 데이터
  FIVE_MINUTES: 5 * 60 * 1000,  // 통계, 랭킹
  THIRTY_MINUTES: 30 * 60 * 1000,
  INFINITY: Infinity,
};
```

### 3-5. 새 기능 추가 시 export 등록
**파일**: `packages/core/src/index.ts`

```typescript
export * from "./features/[feature]/types";
export * from "./features/[feature]/constants";
export { featureKeys } from "./features/[feature]/query-keys";
```

---

## 4. `apps/server` 패턴

### 4-1. 엔티티 (TypeORM)
**디렉토리**: `apps/server/src/features/[feature]/entities/`

```typescript
// 엔티티명: snake_case 테이블명
@Entity({ name: 'used_book_sales' })
export class UsedBookSale {
  @PrimaryGeneratedColumn()
  id: number;

  // timestamp 컬럼: timestamptz 사용 (일부 레거시는 아직 미적용)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // 관계 컬럼: JoinColumn으로 FK명 명시
  @ManyToOne(() => User, (user) => user.usedBookSales, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

**현재 timestamptz 상태**:
- `UsedBookSale`: createdAt/updatedAt → `timestamptz` ✅
- `User`: createdAt/updatedAt → `timestamptz` ✅
- `Notification`: createdAt → `timestamptz` ✅
- `ChatRoom`: createdAt/updatedAt → `timestamptz` **미적용** ⚠️
- `ChatMessage`: createdAt → `timestamptz` **미적용** ⚠️
- `ReadReceipt`: timestamp 컬럼 없음

**DB 설정**: `synchronize: NODE_ENV !== 'production'` (개발 환경에서 자동 동기화).

### 4-2. DTO (class-validator)
**디렉토리**: `apps/server/src/features/[feature]/dtos/`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

// CreateBookSaleDto는 core의 CreateBookSaleParams를 implements하지 않고 있음 (일부 DTO만 implements 패턴 적용)
export class CreateBookSaleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '...', example: '...' })
  title: string;
  // ...
}
```

**참고**: `notification` 모듈은 `dto/` (단수), `user` 모듈은 `dto/`와 `dtos/` 혼재. 새 기능은 `dtos/` (복수형) 사용.

### 4-3. 서비스
**디렉토리**: `apps/server/src/features/[feature]/services/`

- Repository 주입은 `@InjectRepository(Entity)` + `Repository<Entity>`
- 에러는 `BusinessException` 사용 (아래 에러 처리 섹션 참조)
- 이벤트 발행은 `EventEmitter2` (`@nestjs/event-emitter`)

### 4-4. 컨트롤러
```typescript
@ApiTags('...')
@Controller('경로')
export class FeatureController {
  @Post('sub-path')
  @UseGuards(AuthGuard('jwt'))           // 인증 필요
  @ApiOperation({ summary: '...' })
  async method(
    @Body() dto: SomeDto,
    @CurrentUser() user: User,           // @CurrentUser 데코레이터로 인증 유저 주입
  ) { ... }
}
```

- 인증 가드: `AuthGuard('jwt')` (from `@nestjs/passport`)
- 유저 주입: `@CurrentUser()` 데코레이터 (`apps/server/src/features/user/decorators/`)

### 4-5. 모듈 등록
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Entity1, Entity2]),
    DependencyModule,
  ],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],   // 다른 모듈에서 사용할 경우
})
export class FeatureModule {}
```

**앱 모듈**: `apps/server/src/app/app.module.ts`에 새 모듈 등록 필요.
- `EventEmitterModule.forRoot()` 이미 등록됨
- `CLS 기반 트랜잭션`(`@nestjs-cls/transactional`) 사용 중
- `@nestjs/schedule`은 아직 미등록

### 4-6. 에러 처리
**파일**: `apps/server/src/shared/exceptions/error-codes.ts`

```typescript
export const ERROR_CODES = {
  // 도메인_설명 형태의 키
  SALE_NOT_FOUND: { code: 'SALE_001', message: '판매글을 찾을 수 없습니다.' },
  CHAT_FORBIDDEN: { code: 'CHAT_002', message: '채팅방에 접근할 권한이 없습니다.' },
  // ...
};
export type ErrorCode = keyof typeof ERROR_CODES;
```

**사용법**:
```typescript
import { BusinessException } from '@/shared/exceptions';
throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
```

**규칙**: 새 에러 코드 추가 시 반드시 `error-codes.ts`에 등록. 에러 코드 키 명명은 `DOMAIN_DESCRIPTION` 형식.

### 4-7. import 경로 별칭
서버에서 `@/` 별칭 사용: `@/features/...`, `@/shared/...`
- `@/features/user/entities/user.entity` 
- `@/shared/exceptions/business.exception`

일부 레거시 코드는 상대 경로 사용 (`../../user/entities/user.entity`).

---

## 5. `@bookjeok/api-client` 패턴

**파일**: `packages/api-client/src/features/[feature]/apis.ts`

```typescript
import { API_PATHS, SomeType } from "@bookjeok/core";
import { privateApiClient, publicApiClient } from "../../client";

// 인증 필요: privateApiClient
// 공개 API: publicApiClient
export const createBookSale = async (params: CreateBookSaleParams): Promise<UsedBookSale> => {
  const { data } = await privateApiClient.post<UsedBookSale>(API_PATHS.book.sale, params);
  return data;
};
```

**규칙**:
- 각 함수는 `Promise<ResponseType>`을 반환 (`.data` 추출)
- 인증 API는 `privateApiClient`, 공개 API는 `publicApiClient`
- **경로는 항상 `API_PATHS`에서 가져옴** — 문자열 하드코딩 금지
- `packages/api-client/src/index.ts`에 `export * from "./features/[feature]"` 추가 필요

---

## 6. `@bookjeok/react-query` 패턴

### 6-1. Query 훅
**파일**: `packages/react-query/src/features/[feature]/queries.ts`

```typescript
"use client";
import { someApiFn } from "@bookjeok/api-client";
import { featureKeys, CACHE_TIME } from "@bookjeok/core";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

export const useFeatureQuery = (params: SomeParams) => {
  return useQuery({
    queryKey: featureKeys.something(params).queryKey,
    queryFn: () => someApiFn(params),
    staleTime: CACHE_TIME.THIRTY_SECONDS,  // 적절한 캐시 시간
    enabled: !!params.id,                   // 조건부 활성화
  });
};
```

### 6-2. Mutation 훅
**파일**: `packages/react-query/src/features/[feature]/mutations.ts`

```typescript
export const useCreateFeatureMutation = (options?: {
  onSuccess?: (data: Feature) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (params: CreateParams) => createFeature(params),
    ...options,
  });
};
```

**규칙**:
- 파일 최상단에 `"use client"` 선언
- `queryKey`는 반드시 `featureKeys.xxx.queryKey` 사용
- 캐시 무효화는 `queryClient.invalidateQueries({ queryKey: featureKeys._def })`
- `packages/react-query/src/index.ts`에 `export * from "./features/[feature]"` 추가 필요

---

## 7. `apps/web` 프론트엔드 패턴

### 7-1. 디렉토리 구조
```
src/
├── app/[locale]/              # Next.js App Router (i18n 라우트)
│   ├── (auth)/                # 인증 관련 라우트 그룹
│   ├── (default)/             # 기본 레이아웃 라우트 그룹
│   │   ├── my-page/           # 마이페이지 관련
│   │   └── users/             # 유저 프로필
│   ├── (main)/                # 메인 라우트 그룹
│   │   ├── my/                # (주문 관련 마이페이지 등)
│   │   └── order/             # 주문 관련
│   ├── book/                  # 책 관련 (마켓, 검색, 리뷰 등)
│   └── art/                   # 아트 관련
├── views/                     # 페이지 조립 컴포넌트 ([feature]-view/)
├── features/                  # 도메인별 기능
│   └── [feature]/
│       ├── components/        # 기능별 UI 컴포넌트
│       ├── stores/            # Zustand 스토어
│       └── utils/             # 기능별 헬퍼
├── shared/                    # 전역 공유
│   ├── components/
│   │   ├── shadcn/            # shadcn/ui 컴포넌트 (25개+)
│   │   ├── ui/                # 커스텀 공용 UI (pagination, price-display 등)
│   │   ├── common/            # 기타 공용
│   │   └── icons/             # 아이콘
│   ├── constants/             # PATHS, CACHE 등
│   ├── hooks/                 # 공용 훅
│   ├── providers/             # QueryProvider, UserProvider, SocketProvider
│   └── utils/                 # 전역 유틸
└── layouts/                   # 헤더, 푸터, 네비게이션
```

### 7-2. 라우트 경로 상수
**파일**: `apps/web/src/shared/constants/paths.ts`

```typescript
export const PATHS = {
  HOME: "/",
  BOOK_MARKET: "/book/market",
  BOOK_SALES_DETAIL: (id: string) => `/book/sales/${id}`,
  MY_PAGE: "/my-page",
  USER_PROFILE: (handle: string) => `/users/${handle}`,
  // ...
} as const;
```

**규칙**: 라우트 이동 시 반드시 `PATHS.XXX` 사용. 문자열 하드코딩 금지.

### 7-3. 다국어 (i18n)
- `next-intl` 사용
- 모든 라우트는 `[locale]` 세그먼트 하위
- 메시지 파일은 `shared/i18n/` 경로

### 7-4. UI 컴포넌트
- **shadcn/ui** 기반 컴포넌트: `shared/components/shadcn/` (Button, Dialog, Badge, Select, Input, Card 등)
- **Radix UI** 프리미티브 위에 래핑된 형태
- **toast**: `sonner` 사용 (`Toaster` 컴포넌트가 layout에 등록됨)

### 7-5. 전역 프로바이더 구조 (layout.tsx)
```
NextIntlClientProvider
  └── QueryProvider
        └── UserProvider
              ├── SocketProvider (namespace="/notification")
              │     └── NotificationProvider
              └── SocketProvider (namespace="/chat")
                    └── ChatProvider
                          └── OverlayProvider
                                └── children
```

### 7-6. 채팅 시스템 메시지 패턴 (현재)
- 시스템 메시지는 `sender: null`로 구분
- 입장/퇴장 등의 메시지에 별도 `type` 필드 없음 (현재 구조)

---

## 8. 알림 시스템

### 서버
- `NotificationType` enum: `REVIEW_REACTION`, `REVIEW_COMMENT`, `COMMENT_LIKE` (현재 3종)
- `NotificationService.createNotification(recipientId, actorId, type, metadata)`
- 실시간 전송: `NotificationGateway.sendNotification()`
- 이벤트 기반: `EventEmitter2`로 이벤트 발행 → 리스너에서 알림 생성

### 프론트
- `NotificationProvider`가 소켓으로 실시간 수신
- `@bookjeok/core`에 `NotificationType` enum과 `Notification` 인터페이스 정의

---

## 9. 인증 & 토큰 관리

### 크로스 도메인 Bearer 토큰
백엔드와 프론트엔드 배포 도메인이 다르므로 HttpOnly Cookie 대신 `Authorization: Bearer <token>` 헤더 방식 사용.

### 소셜 로그인 플로우 (Ticket Exchange)
1. 카카오/네이버 로그인 완료 → 백엔드가 **60초 유효 1회용 ticket** 발급 → 프론트로 리다이렉트
2. 프론트가 `POST /auth/exchange` 호출 → JWT 발급
3. JWT를 URL에 직접 노출하지 않음

### Silent Refresh & 토큰 무효화
- `packages/api-client`의 Axios 인터셉터가 Access Token 만료 시 Refresh Token으로 자동 갱신
- 로그아웃/보안 무효화 시 `user.tokenVersion` 증가 → 이전 Refresh Token 즉시 무효화

---

## 10. 빌드 & 검증

```bash
# 1. 공용 패키지 빌드 (의존 관계 순서)
pnpm --filter @bookjeok/core build
pnpm --filter @bookjeok/api-client build

# 2. 타입 검사
pnpm --filter @bookjeok/server exec tsc --noEmit
pnpm --filter @bookjeok/web exec tsc --noEmit

# 3. 테스트
pnpm --filter @bookjeok/server test
pnpm --filter @bookjeok/web test
```

---

## 11. 현재 코드베이스의 기존 구조 (결제 관련)

- `apps/server/src/features/order/` — 디렉토리 존재하나 entities, services, controllers, dtos 모두 **비어있음**
- `apps/web/src/features/order/components/` — `checkout/`, `list/`, `review/` 하위 디렉토리 존재 (이전 작업 흔적)
- `packages/core/src/features/order/` — 존재 (이전 작업 흔적 확인 필요)
- `packages/api-client/src/features/order/` — 비어있음
- `packages/react-query/src/features/order/` — 비어있음

---

## 12. 주의사항 요약

1. **API 경로**: `API_PATHS` (core) 사용. 하드코딩 금지.
2. **라우트 경로**: `PATHS` (web/shared/constants) 사용. 하드코딩 금지.
3. **에러 처리**: `BusinessException` + `ERROR_CODES`에 등록. 직접 HttpException 금지.
4. **타입**: core에 인터페이스 → 서버 DTO가 implements. 로컬 중복 타입 금지.
5. **쿼리 키**: `@lukemorales/query-key-factory` 기반. 문자열 배열 직접 사용 금지.
6. **새 모듈**: `app.module.ts` imports에 등록 필수.
7. **테스트**: 서비스는 `.spec.ts` 파일에 단위 테스트 작성.
8. **index.ts export**: core, api-client, react-query 모두 새 feature 추가 시 index.ts에 export 등록.
