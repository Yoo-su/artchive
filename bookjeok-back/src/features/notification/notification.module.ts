import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationTriggerSubscriber } from './subscribers/notification-trigger.subscriber';
import { NotificationListener } from './listeners/notification.listener';
import { NotificationGateway } from './gateways/notification.gateway';
import { UserModule } from '@/features/user/user.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    UserModule,
    JwtModule, // Needed for Gateway JWT verification
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationListener,
    NotificationTriggerSubscriber,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
