import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NOTIFICATION_KEY } from '../decorators/notification.decorator';
import { NotificationType } from '../entities/notification.entity';
import { NotificationStrategyFactory } from '../strategies/notification-strategy.factory';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class NotificationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(NotificationInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly strategyFactory: NotificationStrategyFactory,
    private readonly notificationService: NotificationService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const notificationType = this.reflector.get<NotificationType>(
      NOTIFICATION_KEY,
      context.getHandler(),
    );

    if (!notificationType) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        void this.processNotification(context, notificationType, result);
      }),
    );
  }

  private async processNotification(
    context: ExecutionContext,
    notificationType: NotificationType,
    result: any,
  ) {
    try {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const actorId = user?.id;

      if (!actorId) {
        return;
      }

      const strategy = this.strategyFactory.getStrategy(notificationType);
      const payload = await strategy.createPayload(result, actorId);

      if (payload) {
        await this.notificationService.createNotification(
          payload.recipientId,
          payload.actorId,
          payload.type,
          payload.metadata,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process notification ${notificationType}: ${error.message}`,
        error.stack,
      );
    }
  }
}
