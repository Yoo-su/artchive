import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { Review } from '../entities/review.entity';
import { ReviewReaction } from '../entities/review-reaction.entity';

@Injectable()
export class ReviewCleanupListener {
  private readonly logger = new Logger(ReviewCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저가 작성한 리뷰(Review)와 남긴 리액션(ReviewReaction)을 일괄 삭제합니다.
   */
  @OnEvent('user.withdrawn')
  async handleUserWithdrawn(event: {
    userId: number;
    entityManager: EntityManager;
  }) {
    const { userId, entityManager } = event;

    try {
      // 1. 유저가 남긴 리액션 삭제
      await entityManager.delete(ReviewReaction, {
        user: { id: userId },
      });

      // 2. 유저가 작성한 리뷰 삭제
      await entityManager.delete(Review, {
        user: { id: userId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to clean up review resources for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
