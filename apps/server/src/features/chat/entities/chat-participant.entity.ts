import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';

import { ChatRoom } from './chat-room.entity';

@Entity({ name: 'chat_participants' })
// 방 기준 참여자 조회(메시지 전송 시 상대방 상태 확인)를 위한 인덱스.
// 유저 기준 조회는 아래 @Unique가 만드는 (userId, chatRoomId) 인덱스로 커버됩니다.
@Index('idx_chat_participants_room', ['chatRoom'])
@Unique(['user', 'chatRoom'])
export class ChatParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.chatParticipants)
  user: User;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.participants, {
    onDelete: 'CASCADE',
  })
  chatRoom: ChatRoom;

  // 사용자의 채팅방 참여 상태 (true: 참여중, false: 나감)
  @Column({ default: true })
  isActive: boolean;
}
