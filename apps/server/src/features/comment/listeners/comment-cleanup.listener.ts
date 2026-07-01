import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';

@Injectable()
export class CommentCleanupListener {
  private readonly logger = new Logger(CommentCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저가 누른 댓글 좋아요(CommentLike)를 일괄 삭제하고,
   * 작성한 댓글(Comment)의 userId를 null로 일괄 업데이트하여 익명화합니다.
   */
  @OnEvent('user.withdrawn')
  async handleUserWithdrawn(event: { userId: number; entityManager: EntityManager }) {
    const { userId, entityManager } = event;

    try {
      // 1. 댓글 좋아요 삭제 (댓글 익명화 전에 처리)
      await entityManager.delete(CommentLike, { userId });

      // 2. 댓글 익명화 (사용자 연결 해제)
      await entityManager.update(Comment, { userId }, { userId: null });
    } catch (error) {
      this.logger.error(
        `Failed to clean up comment resources for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
