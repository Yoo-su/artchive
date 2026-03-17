import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

// Request 타입 확장 (correlationId 추가)
declare module 'express' {
  interface Request {
    correlationId?: string;
  }
}

/**
 * 요청/응답 로깅 인터셉터
 *
 * 모든 HTTP 요청에 대해:
 * - 요청 시작 시 correlationId 할당
 * - 요청 완료 시 실행 시간과 함께 로깅
 * - 에러 발생 시 에러 정보 로깅
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // WebSocket 컨텍스트인 경우 로깅 스킵
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body } = request;

    // Correlation ID 설정 (헤더에 있으면 사용, 없으면 생성)
    const correlationId =
      (request.headers['x-correlation-id'] as string) || this.generateId();
    request.correlationId = correlationId;

    // 응답 헤더에 correlation ID 추가
    response.setHeader('X-Correlation-ID', correlationId);

    const startTime = Date.now();

    // 민감한 경로는 body 로깅 제외
    const isAuthPath = url.includes('/auth');
    const logBody = isAuthPath ? '[REDACTED]' : this.sanitizeBody(body);

    this.logger.log({
      type: 'REQUEST',
      correlationId,
      method,
      url,
      body: logBody,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log({
            type: 'RESPONSE',
            correlationId,
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            type: 'ERROR',
            correlationId,
            method,
            url,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }

  /**
   * 간단한 고유 ID 생성
   * UUID 대신 가벼운 구현 사용
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * 요청 본문에서 민감한 정보를 제거합니다.
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
    ];
    const sanitized = { ...body } as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
