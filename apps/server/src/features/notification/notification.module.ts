import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Review } from '@/features/review/entities/review.entity';

import { UserModule } from '../user/user.module';
import { NotificationController } from './controllers/notification.controller';
import { Notification } from './entities/notification.entity';
import { NotificationGateway } from './gateways/notification.gateway';
import { NotificationInterceptor } from './interceptors/notification.interceptor';
import { NotificationService } from './services/notification.service';
import { CommentLikeStrategy } from './strategies/comment-like.strategy';
import { NotificationStrategyFactory } from './strategies/notification-strategy.factory';
import { ReviewCommentStrategy } from './strategies/review-comment.strategy';
import { ReviewReactionStrategy } from './strategies/review-reaction.strategy';

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
