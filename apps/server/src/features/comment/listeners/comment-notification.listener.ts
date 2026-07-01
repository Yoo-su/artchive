import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Review } from '@/features/review/entities/review.entity';
import { NotificationType } from '@/features/notification/entities/notification.entity';
import { NotificationService } from '@/features/notification/services/notification.service';

import { Comment, CommentTargetType } from '../entities/comment.entity';

@Injectable()
export class CommentNotificationListener {
  private readonly logger = new Logger(CommentNotificationListener.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 댓글 생성 시 리뷰 작성자에게 알림을 발송합니다.
   */
  @OnEvent('comment.created')
  async handleCommentCreated(event: { comment: Comment }) {
    const { comment } = event;

    try {
      // 리뷰 대상 댓글인 경우에만 처리
      if (comment.targetType !== CommentTargetType.REVIEW) return;

      const reviewId = parseInt(comment.targetId, 10);
      const review = await this.reviewRepository.findOne({
        where: { id: reviewId },
        relations: ['book'],
      });

      if (!review) return;

      // 본인이 작성한 리뷰글에 본인이 댓글을 단 경우 알림 제외
      if (!comment.userId || review.userId === comment.userId) return;

      await this.notificationService.createNotification(
        review.userId,
        comment.userId,
        NotificationType.REVIEW_COMMENT,
        {
          reviewId: review.id,
          bookTitle: review.book?.title || '알 수 없는 책',
          commentContent: comment.content,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process review comment notification for comment ${comment.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 댓글 좋아요 클릭 시 댓글 작성자에게 알림을 발송합니다.
   */
  @OnEvent('comment.liked')
  async handleCommentLiked(event: { comment: Comment; actorId: number; isLiked: boolean }) {
    const { comment, actorId, isLiked } = event;

    try {
      // 좋아요 추가(isLiked = true) 시에만 알림 발송
      if (!isLiked) return;

      // 본인 댓글에 좋아요를 누른 경우 알림 제외
      if (!comment.userId || comment.userId === actorId) return;

      let reviewId: number | null = null;
      if (comment.targetType === CommentTargetType.REVIEW) {
        reviewId = parseInt(comment.targetId, 10);
      }

      await this.notificationService.createNotification(
        comment.userId,
        actorId,
        NotificationType.COMMENT_LIKE,
        {
          commentId: comment.id,
          reviewId,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process comment like notification for comment ${comment.id}: ${error.message}`,
        error.stack,
      );
    }
  }
}
