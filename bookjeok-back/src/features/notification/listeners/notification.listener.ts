import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../entities/notification.entity';
import {
  CommentLikeCreatedEvent,
  ReviewCommentCreatedEvent,
  ReviewReactionCreatedEvent,
} from '../events/notification-events';

@Injectable()
export class NotificationListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('review.comment.created')
  async handleReviewCommentCreated(event: ReviewCommentCreatedEvent) {
    await this.notificationService.createNotification(
      event.recipientId,
      event.actorId,
      NotificationType.REVIEW_COMMENT,
      {
        reviewId: event.reviewId,
        bookTitle: event.bookTitle,
        commentContent: event.commentContent,
      },
    );
  }

  @OnEvent('review.reaction.created')
  async handleReviewReactionCreated(event: ReviewReactionCreatedEvent) {
    await this.notificationService.createNotification(
      event.recipientId,
      event.actorId,
      NotificationType.REVIEW_REACTION,
      {
        reviewId: event.reviewId,
        bookTitle: event.bookTitle,
      },
    );
  }

  @OnEvent('comment.like.created')
  async handleCommentLikeCreated(event: CommentLikeCreatedEvent) {
    await this.notificationService.createNotification(
      event.recipientId,
      event.actorId,
      NotificationType.COMMENT_LIKE,
      {
        commentId: event.commentId,
        reviewId: event.reviewId,
      },
    );
  }
}
