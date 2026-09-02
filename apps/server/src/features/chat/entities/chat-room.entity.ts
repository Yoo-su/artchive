import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

import { ChatMessage } from './chat-message.entity';
import { ChatParticipant } from './chat-participant.entity';

// 판매글 단위 방 조회(방 찾기/생성, 다른 구매자 알림)용 인덱스
@Index('idx_chat_rooms_used_book_sale', ['usedBookSale'])
@Entity({ name: 'chat_rooms' })
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => UsedBookSale, (sale) => sale.chatRooms, {
    onDelete: 'CASCADE',
  })
  usedBookSale: UsedBookSale;

  @OneToMany(() => ChatParticipant, (participant) => participant.chatRoom)
  participants: ChatParticipant[];

  @OneToMany(() => ChatMessage, (message) => message.chatRoom)
  messages: ChatMessage[];

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
