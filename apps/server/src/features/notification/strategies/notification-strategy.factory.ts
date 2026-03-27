import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { NotificationType } from '../entities/notification.entity';
import { NotificationStrategy } from '../types/notification-strategy.type';
import { CommentLikeStrategy } from './comment-like.strategy';
import { ReviewCommentStrategy } from './review-comment.strategy';
import { ReviewReactionStrategy } from './review-reaction.strategy';

@Injectable()
export class NotificationStrategyFactory {
  // 알림 타입과 전략 클래스 매핑
  private strategies = new Map<NotificationType, any>([
    [NotificationType.REVIEW_COMMENT, ReviewCommentStrategy],
    [NotificationType.REVIEW_REACTION, ReviewReactionStrategy],
    [NotificationType.COMMENT_LIKE, CommentLikeStrategy],
  ]);

  constructor(private readonly moduleRef: ModuleRef) {}

  getStrategy(type: NotificationType): NotificationStrategy {
    const strategyClass = this.strategies.get(type);
    if (!strategyClass) {
      throw new Error(`Strategy not found for notification type: ${type}`);
    }
    // 모듈 컨텍스트에서 전략을 동적으로 해결합니다 (전략 내부에서 DI 사용 가능)
    return this.moduleRef.get(strategyClass, { strict: false });
  }
}
