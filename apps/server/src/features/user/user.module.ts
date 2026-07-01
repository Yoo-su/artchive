import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

import { BookModule } from '../book/book.module';
import { Book } from '../book/entities/book.entity';
import { ChatParticipant } from '../chat/entities/chat-participant.entity';
import { Review } from '../review/entities/review.entity';
import { UserController } from './controllers/user.controller';
import { User } from './entities/user.entity';
import { Wishlist } from './entities/wishlist.entity';
import { UserCleanupListener } from './listeners/user-cleanup.listener';
import { UserService } from './services/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UsedBookSale,
      ChatParticipant,
      Wishlist,
      Book,
      Review,
    ]),
    BookModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserCleanupListener],
  exports: [UserService],
})
export class UserModule {}
