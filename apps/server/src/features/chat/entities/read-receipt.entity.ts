import {
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';

import { ChatMessage } from './chat-message.entity';

@Entity({ name: 'read_receipts' })
// 메시지 기준 조회(읽음 여부 조인, 메시지 삭제 시 CASCADE)를 위한 인덱스.
// (userId, messageId) 조합은 아래 @Unique가 만드는 인덱스로 커버됩니다.
@Index('idx_read_receipts_message', ['message'])
@Unique(['user', 'message']) // 한 유저는 한 메시지에 대해 하나의 읽음 기록만 가질 수 있습니다.
export class ReadReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.readReceipts)
  user: User;

  @ManyToOne(() => ChatMessage, (message) => message.readReceipts, {
    onDelete: 'CASCADE',
  })
  message: ChatMessage;
}
