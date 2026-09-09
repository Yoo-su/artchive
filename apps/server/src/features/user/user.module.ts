import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { Order } from '@/features/order/entities/order.entity';
import { ReadingLog } from '@/features/reading-log/entities/reading-log.entity';
import { Review } from '@/features/review/entities/review.entity';
import { TradeCompletion } from '@/features/trade/entities/trade-completion.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

import { UserController } from './controllers/user.controller';
import { User } from './entities/user.entity';
import { Wishlist } from './entities/wishlist.entity';
import { UserCleanupListener } from './listeners/user-cleanup.listener';
import { UserService } from './services/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Wishlist,
      UsedBookSale,
      ChatParticipant,
      Review,
      Order,
      TradeCompletion,
      ReadingLog,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserCleanupListener],
  exports: [UserService],
})
export class UserModule {}
