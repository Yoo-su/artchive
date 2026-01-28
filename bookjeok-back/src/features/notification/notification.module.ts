import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { NotificationStrategyFactory } from './strategies/notification-strategy.factory';
import { NotificationInterceptor } from './interceptors/notification.interceptor';
import { ReviewCommentStrategy } from './strategies/review-comment.strategy';
import { ReviewReactionStrategy } from './strategies/review-reaction.strategy';
import { CommentLikeStrategy } from './strategies/comment-like.strategy';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';

import { Review } from '@/features/review/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Review]),
    UserModule,
    JwtModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationStrategyFactory,
    NotificationInterceptor,
    ReviewCommentStrategy,
    ReviewReactionStrategy,
    CommentLikeStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: NotificationInterceptor,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
