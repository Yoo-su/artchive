import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { SaleStatus, UsedBookSale } from '../entities/used-book-sale.entity';

@Injectable()
export class UsedBookSaleCleanupListener {
  private readonly logger = new Logger(UsedBookSaleCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저의 중고책 판매글 상태를 WITHDRAWN(탈퇴숨김)으로 일괄 업데이트합니다.
   */
  @OnEvent('user.withdrawn')
  async handleUserWithdrawn(event: { userId: number; entityManager: EntityManager }) {
    const { userId, entityManager } = event;

    try {
      await entityManager.update(
        UsedBookSale,
        { user: { id: userId } },
        { status: SaleStatus.WITHDRAWN },
      );
    } catch (error) {
      this.logger.error(
        `Failed to clean up used book sales for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
