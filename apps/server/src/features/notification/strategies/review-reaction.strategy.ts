import { Injectable } from '@nestjs/common';
import {
  NotificationPayload,
  NotificationStrategy,
} from '../types/notification-strategy.type';
import { NotificationType } from '../entities/notification.entity';
import { ReviewResponseDto } from '@/features/review/dto/review-response.dto';

@Injectable()
export class ReviewReactionStrategy implements NotificationStrategy {
  constructor() {}

  createPayload(
    review: ReviewResponseDto,
    actorId: number,
  ): Promise<NotificationPayload | null> {
    if (review.userId === actorId) return Promise.resolve(null);

    return Promise.resolve({
      recipientId: review.userId,
      actorId,
      type: NotificationType.REVIEW_REACTION,
      metadata: {
        reviewId: review.id,
        bookTitle: review.book?.title || '알 수 없는 책',
      },
    });
  }
}
