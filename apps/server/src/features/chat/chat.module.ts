import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

import { AuthModule } from '../auth/auth.module';
import { BookModule } from '../book/book.module';
import { UserModule } from '../user/user.module';
import { ChatController } from './controllers/chat.controller';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { ReadReceipt } from './entities/read-receipt.entity';
import { ChatGateway } from './gateways/chat.gateway';
import { SocketAuthGuard } from './guards/socket-auth.guard';
import { ChatCleanupListener } from './listeners/chat-cleanup.listener';
import { ChatService } from './services/chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom,
      ChatParticipant,
      ChatMessage,
      UsedBookSale,
      ReadReceipt,
    ]),
    AuthModule,
    UserModule,
    BookModule,
  ],
  providers: [ChatGateway, ChatService, SocketAuthGuard, ChatCleanupListener],
  controllers: [ChatController],
})
export class ChatModule {}
