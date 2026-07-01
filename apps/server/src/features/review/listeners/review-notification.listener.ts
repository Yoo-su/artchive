import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { NotificationType } from '@/features/notification/entities/notification.entity';
import { NotificationService } from '@/features/notification/services/notification.service';
import { ReviewResponseDto } from '@/features/review/dto/review-response.dto';

@Injectable()
export class ReviewNotificationListener {
  private readonly logger = new Logger(ReviewNotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 리뷰 리액션 추가 시 리뷰 작성자에게 알림을 발송합니다.
   */
  @OnEvent('review.reacted')
  async handleReviewReacted(event: { review: ReviewResponseDto; actorId: number }) {
    const { review, actorId } = event;

    try {
      // 본인 글에 리액션을 남긴 경우 알림 제외
      if (review.userId === actorId) return;

      await this.notificationService.createNotification(
        review.userId,
        actorId,
        NotificationType.REVIEW_REACTION,
        {
          reviewId: review.id,
          bookTitle: review.book?.title || '알 수 없는 책',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process review reaction notification for review ${review.id}: ${error.message}`,
        error.stack,
      );
    }
  }
}
