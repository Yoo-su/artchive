# 02. 백엔드(NestJS Server) 컨벤션

> `apps/server` 개발 시 준수해야 하는 TypeORM, 트랜잭션, 예외 처리 및 DTO 규칙입니다.

---

## 1. 엔티티 (TypeORM)

**디렉토리**: `apps/server/src/features/[feature]/entities/`

```typescript
@Entity({ name: 'used_book_sales' })
export class UsedBookSale {
  @PrimaryGeneratedColumn()
  id: number;

  // timestamp 컬럼: 무조건 timestamptz 사용
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // 동시성 제어가 필요한 경우 낙관적 락 적용
  @VersionColumn({ default: 1 })
  version: number;

  @ManyToOne(() => User, (user) => user.usedBookSales, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

- **타임스탬프**: 모든 엔티티의 생성일/수정일/일시 컬럼은 `{ type: 'timestamptz' }` 필수 지정.
- **관계 매핑**: 외래키 명시를 위해 `@JoinColumn({ name: '...' })` 사용.
- **동기화**: `synchronize: NODE_ENV !== 'production'` (개발 환경에서 자동 반영).

---

## 2. DTO & Validation

**디렉토리**: `apps/server/src/features/[feature]/dtos/`

- 디렉토리명은 복수형 **`dtos/`** 통일.
- Swagger 문서화를 위한 `@ApiProperty()`와 유효성 검사용 `class-validator` 데코레이터 적용.
- 코어 파라미터 타입 일치를 위해 `implements [CoreParamsInterface]` 적용 권장.

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { CreateBookSaleParams } from '@bookjeok/core';

export class CreateBookSaleDto implements CreateBookSaleParams {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '판매글 제목', example: '클린 코드 판매합니다' })
  title: string;
}
```

---

## 3. 트랜잭션 관리 (CLS Transactional)

- `@nestjs-cls/transactional` 기반 선언적 트랜잭션 사용.
- 서비스 메서드에 `@Transactional()` 데코레이터 선언.
- 트랜잭션 내 DB 조작은 `this.txHost.tx`를 통해 EntityManager 활용.

```typescript
@Injectable()
export class OrderService {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  @Transactional()
  async createOrder(...) {
    const manager = this.txHost.tx;
    // manager.findOne, manager.save 등 실행
  }
}
```

---

## 4. 비즈니스 예외 처리 (`BusinessException`)

**파일**: `apps/server/src/shared/exceptions/error-codes.ts`

- **규칙**: 임의의 `HttpException`, `BadRequestException`, `NotFoundException` 직접 throw 금지.
- 반드시 `ERROR_CODES`에 코드를 등록하고 `BusinessException`으로 발생시킬 것.
- 에러 코드 키는 `[DOMAIN]_[DESCRIPTION]` 형식 유지.

```typescript
import { HttpStatus } from '@nestjs/common';
import { BusinessException } from '@/shared/exceptions/business.exception';

// 올바른 예:
throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
```

---

## 5. 경로 별칭 & 모듈 등록

- **Import Alias**: 서버 코드 내부에서는 항상 `@/features/...`, `@/shared/...` 별칭 사용 (`../../` 상대 경로 금지).
- **모듈 등록**: 신규 도메인 모듈 생성 시 `apps/server/src/app/app.module.ts`의 `imports` 배열에 등록 필수.
- **스케줄러 & 이벤트**:
  - `@nestjs/schedule` 스케줄러 배치: `apps/server/src/features/order/services/order-scheduler.service.ts` 등에서 `@Cron()` 활용.
  - 비동기 도메인 이벤트: `EventEmitter2` 및 `@OnEvent()` 리스너 사용.
