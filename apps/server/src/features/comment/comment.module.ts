import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookModule } from '@/features/book/book.module';
import { NotificationModule } from '@/features/notification/notification.module';
import { ReviewModule } from '@/features/review/review.module';

import { CommentController } from './controllers/comment.controller';
import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { CommentCleanupListener } from './listeners/comment-cleanup.listener';
import { CommentNotificationListener } from './listeners/comment-notification.listener';
import { CommentService } from './services/comment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentLike]),
    NotificationModule,
    ReviewModule,
    BookModule,
  ],
  controllers: [CommentController],
  providers: [
    CommentService,
    CommentNotificationListener,
    CommentCleanupListener,
  ],
  exports: [CommentService],
})
export class CommentModule {}
