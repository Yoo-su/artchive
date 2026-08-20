import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      return next.handle();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;
    const cachedStatus = await this.cacheManager.get(cacheKey);

    if (cachedStatus === 'processing') {
      throw new ConflictException('이미 처리 중인 요청입니다.');
    } else if (cachedStatus) {
      throw new ConflictException('이미 처리 완료된 요청입니다.');
    }

    // 락 설정: 10분(600,000ms) 유지
    await this.cacheManager.set(cacheKey, 'processing', 600000);

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          // 성공 시 완료 상태 유지 (10분)
          this.cacheManager
            .set(cacheKey, data || 'completed', 600000)
            .catch((e) => console.error('Cache set error:', e));
        },
        error: () => {
          // 실패 시 재시도를 위해 락 제거
          this.cacheManager
            .del(cacheKey)
            .catch((e) => console.error('Cache del error:', e));
        },
      }),
    );
  }
}
