import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatModule } from '@/features/chat/chat.module';
import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { ChatRoom } from '@/features/chat/entities/chat-room.entity';
import { NotificationModule } from '@/features/notification/notification.module';
import { TradeModule } from '@/features/trade/trade.module';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { User } from '@/features/user/entities/user.entity';

import { OrderController } from './controllers/order.controller';
import { TossWebhookController } from './controllers/toss-webhook.controller';
import { Order } from './entities/order.entity';
import { PaymentFeatureGuard } from './guards/payment-feature.guard';
import { OrderEventListener } from './listeners/order-event.listener';
import { DeliveryTrackerService } from './services/delivery-tracker.service';
import { OrderService } from './services/order.service';
import { OrderSchedulerService } from './services/order-scheduler.service';
import { TossPaymentsService } from './services/toss-payments.service';

@Module({
  imports: [
    HttpModule,
    NotificationModule,
    ChatModule,
    TradeModule,
    TypeOrmModule.forFeature([
      Order,
      UsedBookSale,
      User,
      ChatRoom,
      ChatParticipant,
    ]),
  ],
  controllers: [OrderController, TossWebhookController],
  providers: [
    PaymentFeatureGuard,
    OrderService,
    TossPaymentsService,
    DeliveryTrackerService,
    OrderSchedulerService,
    OrderEventListener,
  ],
  exports: [
    OrderService,
    TossPaymentsService,
    DeliveryTrackerService,
    OrderSchedulerService,
  ],
})
export class OrderModule {}
