import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatModule } from '@/features/chat/chat.module';
import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { NotificationModule } from '@/features/notification/notification.module';
import { Order } from '@/features/order/entities/order.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { User } from '@/features/user/entities/user.entity';

import { TradeCompletionController } from './controllers/trade-completion.controller';
import { TradeReviewController } from './controllers/trade-review.controller';
import { TradeCompletion } from './entities/trade-completion.entity';
import { TradeReview } from './entities/trade-review.entity';
import { TradeEventListener } from './listeners/trade-event.listener';
import { TradeCompletionService } from './services/trade-completion.service';
import { TradeReviewService } from './services/trade-review.service';

/**
 * "거래가 성사됐다"는 사실을 다루는 모듈.
 *
 * 결제(OrderModule)와 분리되어 있습니다. 이 모듈은 order의 엔티티만 읽고
 * OrderModule 자체는 import 하지 않으므로, 나중에 결제 쪽에서 완료 기록을
 * 남길 때 order -> trade 한 방향 의존만 생깁니다.
 */
@Module({
  imports: [
    NotificationModule,
    ChatModule,
    TypeOrmModule.forFeature([
      TradeCompletion,
      TradeReview,
      UsedBookSale,
      User,
      ChatParticipant,
      Order,
    ]),
  ],
  controllers: [TradeCompletionController, TradeReviewController],
  providers: [TradeCompletionService, TradeReviewService, TradeEventListener],
  exports: [TradeCompletionService, TradeReviewService],
})
export class TradeModule {}
