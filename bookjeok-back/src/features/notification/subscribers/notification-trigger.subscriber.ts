import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  Comment,
  CommentTargetType,
} from '@/features/comment/entities/comment.entity';
import { CommentLike } from '@/features/comment/entities/comment-like.entity';
import { ReviewReaction } from '@/features/review/entities/review-reaction.entity';
import { Review } from '@/features/review/entities/review.entity';
import { User } from '@/features/user/entities/user.entity';

import {
  CommentLikeCreatedEvent,
  ReviewCommentCreatedEvent,
  ReviewReactionCreatedEvent,
} from '../events/notification-events';

@Injectable()
@EventSubscriber()
export class NotificationTriggerSubscriber
  implements EntitySubscriberInterface
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {
    dataSource.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<any>) {
    const { entity, manager } = event;

    // 1. 댓글 작성 알림 (리뷰 댓글만)
    if (entity instanceof Comment) {
      if (entity.targetType === CommentTargetType.REVIEW) {
        // 상세 정보 조회를 위해 별도 쿼리 (entity에는 relation 정보가 없을 수 있음)
        const review = await manager.findOne(Review, {
          where: { id: parseInt(entity.targetId, 10) },
          relations: ['book', 'user'],
        });

        let commenter: User | null = null;
        if (entity.userId) {
          commenter = await manager.findOne(User, {
            where: { id: entity.userId },
          });
        }

        if (
          review &&
          commenter &&
          entity.userId &&
          review.userId !== entity.userId
        ) {
          this.eventEmitter.emit(
            'review.comment.created',
            new ReviewCommentCreatedEvent(
              review.id,
              review.book?.title || '알 수 없는 책',
              entity.content,
              review.userId, // recipient
              entity.userId, // actor
              commenter.nickname,
              commenter.profileImageUrl,
            ),
          );
        }
      }
    }

    // 2. 리뷰 리액션 알림
    else if (entity instanceof ReviewReaction) {
      const review = await manager.findOne(Review, {
        where: { id: entity.reviewId },
        relations: ['book', 'user'],
      });

      let actor: User | null = null;
      if (entity.userId) {
        actor = await manager.findOne(User, {
          where: { id: entity.userId },
        });
      }

      if (review && actor && entity.userId && review.userId !== entity.userId) {
        this.eventEmitter.emit(
          'review.reaction.created',
          new ReviewReactionCreatedEvent(
            review.id,
            review.book?.title || '알 수 없는 책',
            review.userId, // recipient
            entity.userId, // actor
            actor.nickname,
            actor.profileImageUrl,
          ),
        );
      }
    }

    // 3. 댓글 좋아요 알림
    else if (entity instanceof CommentLike) {
      const comment = await manager.findOne(Comment, {
        where: { id: entity.commentId },
        // relations: ['user'] // user relation needed to know recipient
      });

      let liker: User | null = null;
      if (entity.userId) {
        liker = await manager.findOne(User, {
          where: { id: entity.userId },
        });
      }

      if (
        comment &&
        liker &&
        entity.userId &&
        comment.userId !== entity.userId
      ) {
        let reviewId: number | null = null;
        if (comment.targetType === CommentTargetType.REVIEW) {
          reviewId = parseInt(comment.targetId, 10);
        }

        this.eventEmitter.emit(
          'comment.like.created',
          new CommentLikeCreatedEvent(
            comment.id,
            reviewId,
            comment.userId!, // recipient (Non-null assertion as it exists if we are here)
            entity.userId, // actor
            liker.nickname,
            liker.profileImageUrl,
          ),
        );
      }
    }
  }
}
