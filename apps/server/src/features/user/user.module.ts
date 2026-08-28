import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatParticipant } from '../chat/entities/chat-participant.entity';
import { Order } from '../order/entities/order.entity';
import { Review } from '../review/entities/review.entity';
import { UsedBookSale } from '../used-book-sale/entities/used-book-sale.entity';
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
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserCleanupListener],
  exports: [UserService],
})
export class UserModule {}
