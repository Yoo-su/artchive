import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { LlmTalkLog } from '../entities/llm-talk-log.entity';

@Injectable()
export class LlmCleanupListener {
  private readonly logger = new Logger(LlmCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저가 AI와 나눈 대화 로그(LlmTalkLog)를 일괄 삭제합니다.
   * LlmTalkLog.userId가 string 형식이므로 String(userId)로 매핑하여 일치시킵니다.
   */
  @OnEvent('user.withdrawn')
  async handleUserWithdrawn(event: {
    userId: number;
    entityManager: EntityManager;
  }) {
    const { userId, entityManager } = event;

    try {
      await entityManager.delete(LlmTalkLog, { userId: String(userId) });
    } catch (error) {
      this.logger.error(
        `Failed to clean up LLM talk logs for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
