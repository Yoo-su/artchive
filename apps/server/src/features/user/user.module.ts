import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './services/user.service';
import { User } from './entities/user.entity';
import { UserController } from './controllers/user.controller';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { ChatParticipant } from '../chat/entities/chat-participant.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Book } from '../book/entities/book.entity';
import { Review } from '../review/entities/review.entity';
import { BookModule } from '../book/book.module';

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
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
