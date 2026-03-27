import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Comment,
  CommentTargetType,
} from '@/features/comment/entities/comment.entity';
import { Review } from '@/features/review/entities/review.entity';

import { NotificationType } from '../entities/notification.entity';
import {
  NotificationPayload,
  NotificationStrategy,
} from '../types/notification-strategy.type';

@Injectable()
export class ReviewCommentStrategy implements NotificationStrategy {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async createPayload(
    comment: Comment,
    actorId: number,
  ): Promise<NotificationPayload | null> {
    // 리뷰 댓글만 처리
    if (comment.targetType !== CommentTargetType.REVIEW) return null;

    const reviewId = parseInt(comment.targetId, 10);
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['book'],
    });

    if (!review) return null;

    // 작성자가 수신자인 경우 알림을 보내지 않음 (자신의 글에 댓글)
    if (review.userId === actorId) return null;

    return {
      recipientId: review.userId,
      actorId,
      type: NotificationType.REVIEW_COMMENT,
      metadata: {
        reviewId: review.id,
        bookTitle: review.book?.title || '알 수 없는 책',
        commentContent: comment.content,
      },
    };
  }
}
