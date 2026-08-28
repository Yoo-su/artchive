import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatModule } from '@/features/chat/chat.module';
import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { ChatRoom } from '@/features/chat/entities/chat-room.entity';
import { NotificationModule } from '@/features/notification/notification.module';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { User } from '@/features/user/entities/user.entity';

import { OrderController } from './controllers/order.controller';
import { TossWebhookController } from './controllers/toss-webhook.controller';
import { TradeReviewController } from './controllers/trade-review.controller';
import { Order } from './entities/order.entity';
import { TradeReview } from './entities/trade-review.entity';
import { PaymentFeatureGuard } from './guards/payment-feature.guard';
import { OrderEventListener } from './listeners/order-event.listener';
import { DeliveryTrackerService } from './services/delivery-tracker.service';
import { OrderService } from './services/order.service';
import { OrderSchedulerService } from './services/order-scheduler.service';
import { TossPaymentsService } from './services/toss-payments.service';
import { TradeReviewService } from './services/trade-review.service';

@Module({
  imports: [
    HttpModule,
    NotificationModule,
    ChatModule,
    TypeOrmModule.forFeature([
      Order,
      TradeReview,
      UsedBookSale,
      User,
      ChatRoom,
      ChatParticipant,
    ]),
  ],
  controllers: [OrderController, TossWebhookController, TradeReviewController],
  providers: [
    PaymentFeatureGuard,
    OrderService,
    TossPaymentsService,
    DeliveryTrackerService,
    OrderSchedulerService,
    TradeReviewService,
    OrderEventListener,
  ],
  exports: [
    OrderService,
    TossPaymentsService,
    DeliveryTrackerService,
    OrderSchedulerService,
    TradeReviewService,
  ],
})
export class OrderModule {}
