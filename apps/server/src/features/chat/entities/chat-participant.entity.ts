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

  // "여기까지 읽음" 워터마크. 이 값보다 큰 ID의 메시지가 안 읽은 메시지입니다.
  // 읽음 여부를 메시지 건당 행으로 쌓지 않고 참여자 행 한 칸으로 표현합니다.
  // 메시지 FK를 걸지 않는 이유: 읽은 지점을 가리키는 표식일 뿐이고,
  // 메시지가 지워져도 워터마크는 그대로 유효해야 합니다.
  // 인덱스는 두지 않습니다. 이 컬럼은 (userId, chatRoomId)로 찾은 행에서 읽고
  // 쓰기만 하고, 조건으로 거는 쪽은 항상 chat_messages.id입니다.
  @Column({ type: 'int', nullable: true })
  lastReadMessageId: number | null;
}
