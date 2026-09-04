import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { ChatMessageType } from '@/features/chat/entities/chat-message.entity';
import { ChatService } from '@/features/chat/services/chat.service';
import { NotificationType } from '@/features/notification/entities/notification.entity';
import { NotificationService } from '@/features/notification/services/notification.service';
import { SaleStatus } from '@/features/used-book-sale/entities/used-book-sale.entity';

import { TradeCompletionMethod } from '../entities/trade-completion.entity';

/**
 * 직거래 예약·완료에 따르는 알림과 채팅 시스템 메시지.
 *
 * 결제 흐름의 `OrderEventListener`와 같은 역할을 결제 없는 거래에 대해 합니다.
 */
@Injectable()
export class TradeEventListener {
  private readonly logger = new Logger(TradeEventListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * 판매자가 거래 상대를 지정했을 때
   */
  @OnEvent('trade.reserved')
  async handleReserved(event: {
    saleId: number;
    sellerId: number;
    buyerId: number;
    chatRoomId?: number | null;
  }) {
    try {
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.TRADE_RESERVED,
        { saleId: event.saleId },
      );

      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          '판매자가 거래 상대로 지정했습니다. 채팅으로 거래 장소와 시간을 정해보세요.',
          ChatMessageType.TRADE_ACTION,
          { saleId: event.saleId, status: SaleStatus.RESERVED },
        );
      }

      // 다른 구매희망자 채팅방에 거래 진행 중 안내
      await this.chatService.notifyOtherBuyersTrading(
        event.saleId,
        event.chatRoomId,
      );
    } catch (error) {
      this.logger.error(
        `trade.reserved 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 판매자가 예약을 취소했을 때
   */
  @OnEvent('trade.reservation_cancelled')
  async handleReservationCancelled(event: {
    saleId: number;
    sellerId: number;
    buyerId: number | null;
  }) {
    try {
      if (!event.buyerId) return;

      await this.chatService.notifySaleBackOnMarket(event.saleId);
    } catch (error) {
      this.logger.error(
        `trade.reservation_cancelled 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 직거래가 완료됐을 때
   */
  @OnEvent('trade.completed')
  async handleCompleted(event: {
    completionId: number;
    saleId: number;
    sellerId: number;
    buyerId: number;
    chatRoomId?: number | null;
    method: TradeCompletionMethod;
  }) {
    try {
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.TRADE_COMPLETED,
        { saleId: event.saleId, completionId: event.completionId },
      );

      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          '거래가 완료되었습니다. 서로에게 거래 후기를 남겨보세요.',
          ChatMessageType.TRADE_ACTION,
          {
            saleId: event.saleId,
            completionId: event.completionId,
            status: SaleStatus.SOLD,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `trade.completed 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }
}
