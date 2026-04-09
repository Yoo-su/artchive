import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ActivityType } from '../activity-type.enum';
import { TRACK_ACTIVITY_KEY } from '../decorators/track-activity.decorator';

@Injectable()
export class ActivityTrackingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const activityType = this.reflector.get<ActivityType>(
      TRACK_ACTIVITY_KEY,
      context.getHandler(),
    );

    // 대상이 아닌 경우 바로 통과
    if (!activityType) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // 응답이 성공적으로 나간 후 비동기로 처리
        this.processActivityLog(context, activityType);
      }),
    );
  }

  private processActivityLog(
    context: ExecutionContext,
    activityType: ActivityType,
  ) {
    if (context.getType() !== 'http') return;

    try {
      const request = context
        .switchToHttp()
        .getRequest<Request & { user?: { id: number } }>();
      const user = request.user;

      const ip =
        request.headers['x-forwarded-for']?.toString().split(',')[0] ||
        request.ip ||
        request.socket?.remoteAddress;

      const userAgent = request.get('user-agent') || '';

      // URL 파라미터나 body에서 주요 식별자만 가볍게 추출
      const details = {
        ...(Object.keys(request.params || {}).length > 0
          ? { params: request.params }
          : {}),
        ...(request.body?.keyword ? { keyword: request.body.keyword } : {}),
        ...(request.body?.type ? { type: request.body.type } : {}), // reaction type 등
      };

      const logData = {
        userId: user?.id || null,
        activityType,
        method: request.method,
        path: request.originalUrl || request.url,
        ip,
        userAgent,
        details: Object.keys(details).length > 0 ? details : null,
      };

      this.eventEmitter.emit('ACTIVITY_LOG.CREATED', logData);
    } catch (error) {
      console.error(
        `Failed to dispatch activity log for ${activityType}:`,
        error,
      );
    }
  }
}
