import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';

import { ChatRoom } from './chat-room.entity';

export enum ChatMessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
  TRADE_STATUS = 'TRADE_STATUS',
  TRADE_ACTION = 'TRADE_ACTION',
  IMAGE = 'IMAGE',
}

// 방별 최신순 조회(목록의 마지막 메시지, 커서 페이지네이션, 안 읽음 집계)가
// 모든 채팅 쿼리의 기본 접근 경로라 복합 인덱스가 필요합니다.
@Index('idx_chat_messages_room_created_at', ['chatRoom', 'createdAt'])
// 안 읽음 집계는 "내가 보내지 않은 메시지"를 방 단위로 훑습니다.
// (참여자의 lastReadMessageId 워터마크보다 뒤에 있는 메시지를 세는 경로입니다.)
@Index('idx_chat_messages_room_sender', ['chatRoom', 'sender'])
@Entity({ name: 'chat_messages' })
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ChatMessageType,
    default: ChatMessageType.TEXT,
  })
  type: ChatMessageType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  sender: User | null;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages, {
    onDelete: 'CASCADE',
  })
  chatRoom: ChatRoom;
}
