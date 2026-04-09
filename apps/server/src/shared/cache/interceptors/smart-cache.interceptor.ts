import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import {
  SMART_CACHE_KEY,
  SmartCacheOptions,
} from '../decorators/smart-cache.decorator';
import { SmartCacheStore } from '../smart-cache.store';

@Injectable()
export class SmartCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly smartCacheStore: SmartCacheStore,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const options = this.reflector.get<SmartCacheOptions>(
      SMART_CACHE_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const { prefix, ttl = 60000, keyStrategy = 'ip' } = options;
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(prefix, keyStrategy, request);

    // 1. 캐시 확인
    const cachedData = await this.smartCacheStore.get(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    // 2. 캐시 미스 시 로직 실행 후 저장
    return next.handle().pipe(
      tap((response) => {
        void (async () => {
          // 성공적인 응답(데이터가 있는 경우)만 캐싱
          if (response !== undefined) {
            await this.smartCacheStore.set(prefix, cacheKey, response, ttl);
          }
        })();
      }),
    );
  }

  private generateCacheKey(
    prefix: string,
    strategy: string,
    request: Request & { user?: { id: number } },
  ): string {
    const ip =
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      request.ip ||
      request.socket?.remoteAddress ||
      'unknown_ip';

    const userId = request.user?.id || 'guest';
    const query = JSON.stringify(request.query || {});

    // URL, 파라미터 정보까지 포함하여 유니크하게 구성
    const routeKey = `${request.path}_${query}`;

    switch (strategy) {
      case 'ip':
        return `${prefix}:ip_${ip}:${routeKey}`;
      case 'user':
        return `${prefix}:user_${userId}:${routeKey}`;
      case 'ip+user':
        return `${prefix}:mix_${ip}_${userId}:${routeKey}`;
      case 'global':
      default:
        return `${prefix}:global:${routeKey}`;
    }
  }
}
