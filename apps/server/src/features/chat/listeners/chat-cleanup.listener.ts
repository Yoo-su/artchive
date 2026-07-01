import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { ChatParticipant } from '../entities/chat-participant.entity';
import { ReadReceipt } from '../entities/read-receipt.entity';

@Injectable()
export class ChatCleanupListener {
  private readonly logger = new Logger(ChatCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저의 채팅 참여 이력을 비활성화(isActive = false)하고
   * 읽음 확인 내역(ReadReceipt)을 일괄 삭제합니다.
   */
  @OnEvent('user.withdrawn')
  async handleUserWithdrawn(event: {
    userId: number;
    entityManager: EntityManager;
  }) {
    const { userId, entityManager } = event;

    try {
      // 1. 채팅방 참여 상태 비활성화
      await entityManager.update(
        ChatParticipant,
        { user: { id: userId } },
        { isActive: false },
      );

      // 2. 읽음 확인 기록 삭제
      await entityManager.delete(ReadReceipt, { user: { id: userId } });
    } catch (error) {
      this.logger.error(
        `Failed to clean up chat resources for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
