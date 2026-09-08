import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export abstract class BaseViewCountInterceptor implements NestInterceptor {
  // 로그에 추상 클래스명이 아니라 실제 인터셉터명이 찍히도록 한다.
  private readonly logger = new Logger(this.constructor.name);

  constructor(protected cacheManager: Cache) {}

  /**
   * 캐시 키에 사용할 접두사 (예: 'view_count', 'used_book_view_count')
   */
  protected abstract get cachePrefix(): string;

  /**
   * 요청에서 리소스 ID를 추출합니다.
   * 기본적으로 params.id를 사용하며, 필요시 오버라이드하세요.
   * @param request Express Request 객체
   */
  protected getResourceId(request: Request): string | number | undefined {
    const id = request.params.id as string | string[] | undefined;
    if (Array.isArray(id)) {
      return id[0];
    }
    return id;
  }

  /**
   * 실제 조회수를 증가시키는 비즈니스 로직을 구현해야 합니다.
   * @param id 대상 리소스 ID (number 또는 string)
   */
  protected abstract incrementCount(id: number | string): Promise<void>;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const id = this.getResourceId(request);
    const ip = this.resolveClientIp(request);

    // 핸들러가 성공한 뒤에만 센다. 앞에서 올리면 404·403으로 끝난 요청까지
    // 조회수에 잡힌다.
    return next.handle().pipe(
      tap(() => {
        if (!id || !ip) return;
        void this.recordView(id, ip);
      }),
    );
  }

  /**
   * 24시간 중복 방지를 확인하고 조회수를 올립니다.
   * 조회수 집계 실패가 본 응답을 막아서는 안 되므로 예외를 삼킵니다.
   */
  private async recordView(id: string | number, ip: string): Promise<void> {
    const cacheKey = `${this.cachePrefix}:${id}:${ip}`;

    try {
      const isViewed = await this.cacheManager.get(cacheKey);
      if (isViewed) return;

      await this.incrementCount(id);
      // 24시간 TTL (밀리초 단위)
      await this.cacheManager.set(cacheKey, '1', 24 * 60 * 60 * 1000);
    } catch (error: unknown) {
      this.logger.warn(
        `조회수 기록 실패 (${cacheKey}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 신뢰할 수 있는 클라이언트 IP를 구합니다.
   *
   * `x-forwarded-for`는 클라이언트가 마음대로 지어낼 수 있어, 그대로 믿으면
   * 헤더만 바꿔가며 조회수를 무한히 올릴 수 있습니다. Express의 `trust proxy`
   * 설정을 거친 `request.ip`를 먼저 쓰고, 그것이 없을 때만 소켓 주소로
   * 내려갑니다.
   */
  private resolveClientIp(request: Request): string | undefined {
    return request.ip || request.socket?.remoteAddress || undefined;
  }
}
