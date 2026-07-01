import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationModule } from '@/features/notification/notification.module';
import { Review } from '@/features/review/entities/review.entity';

import { CommentController } from './controllers/comment.controller';
import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { CommentNotificationListener } from './listeners/comment-notification.listener';
import { CommentService } from './services/comment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, CommentLike, Review]),
    NotificationModule,
  ],
  controllers: [CommentController],
  providers: [CommentService, CommentNotificationListener],
  exports: [CommentService],
})
export class CommentModule {}
