import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { INVALIDATE_CACHE_KEY } from '../decorators/invalidate-cache.decorator';
import { SmartCacheStore } from '../smart-cache.store';

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly smartCacheStore: SmartCacheStore,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const prefixes = this.reflector.get<string[]>(
      INVALIDATE_CACHE_KEY,
      context.getHandler(),
    );

    if (!prefixes || prefixes.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        void (async () => {
          try {
            // CUD 성공 시에만 해당 prefix들의 캐시를 일괄 삭제합니다.
            for (const prefix of prefixes) {
              await this.smartCacheStore.invalidateByPrefix(prefix);
            }
          } catch (error: unknown) {
            this.logger.error(
              `Cache invalidation error: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        })();
      }),
    );
  }
}
