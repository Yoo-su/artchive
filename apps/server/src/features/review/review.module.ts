import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { NotificationModule } from '@/features/notification/notification.module';

import { BookModule } from '../book/book.module';
import { ReviewController } from './controllers/review.controller';
import { Review } from './entities/review.entity';
import { ReviewReaction } from './entities/review-reaction.entity';
import { Tag } from './entities/tag.entity';
import { ReviewImageHelper } from './helpers/review-image.helper';
import { ReviewNotificationListener } from './listeners/review-notification.listener';
import { ReviewService } from './services/review.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Book, ReviewReaction, Tag]),
    BookModule,
    NotificationModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewImageHelper, ReviewNotificationListener],
  exports: [ReviewService],
})
export class ReviewModule {}
