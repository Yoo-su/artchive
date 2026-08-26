import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { User } from '@/features/user/entities/user.entity';

import { MailService } from '../mail.service';

export interface ChatRoomCreatedEvent {
  seller: User;
  buyerNickname: string;
  bookTitle: string;
  chatRoomId: number;
}

@Injectable()
export class MailEventListener {
  private readonly logger = new Logger(MailEventListener.name);

  constructor(private readonly mailService: MailService) {}

  @OnEvent('chat.room_created', { async: true })
  async handleChatRoomCreated(event: ChatRoomCreatedEvent) {
    try {
      const { seller, buyerNickname, bookTitle, chatRoomId } = event;
      await this.mailService.sendChatRoomCreatedNotification(
        seller,
        buyerNickname,
        bookTitle,
        chatRoomId,
      );
    } catch (error) {
      this.logger.error('Failed to process chat.room_created event:', error);
    }
  }
}
