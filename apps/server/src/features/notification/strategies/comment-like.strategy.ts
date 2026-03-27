import { Injectable } from '@nestjs/common';

import {
  Comment,
  CommentTargetType,
} from '@/features/comment/entities/comment.entity';

import { NotificationType } from '../entities/notification.entity';
import {
  NotificationPayload,
  NotificationStrategy,
} from '../types/notification-strategy.type';

@Injectable()
export class CommentLikeStrategy implements NotificationStrategy {
  // 서비스는 isLiked 불리언이 포함된 댓글 DTO를 반환합니다.
  // result: { ...Comment, isLiked: boolean }

  createPayload(
    result: any,
    actorId: number,
  ): Promise<NotificationPayload | null> {
    const comment = result as Comment & { isLiked: boolean };

    // 좋아요가 추가된 경우에만 알림 (취소 시 알림 안 함)
    if (!comment.isLiked) return Promise.resolve(null);

    // 자신의 글에 좋아요한 경우 알림 안 함
    if (comment.userId === actorId) return Promise.resolve(null);

    let reviewId: number | null = null;
    if (comment.targetType === CommentTargetType.REVIEW) {
      reviewId = parseInt(comment.targetId, 10);
    }

    return Promise.resolve({
      recipientId: comment.userId!,
      actorId,
      type: NotificationType.COMMENT_LIKE,
      metadata: {
        commentId: comment.id,
        reviewId: reviewId,
      },
    });
  }
}
