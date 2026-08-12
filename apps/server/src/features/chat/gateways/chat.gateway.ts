import { forwardRef, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JwtPayload } from '@/features/auth/types/jwt-payload.type';
import { User } from '@/features/user/entities/user.entity';
import { UserService } from '@/features/user/services/user.service';

import { ChatMessage } from '../entities/chat-message.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatService } from '../services/chat.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_DOMAIN ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'chat',
  pingInterval: 10000, // 10초마다 ping 전송
  pingTimeout: 5000, // 5초 내 pong 응답이 없으면 연결 끊김 처리
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new Error(`ID가 ${payload.sub}인 사용자를 찾을 수 없습니다.`);
      }

      client.data.user = user;

      // 멀티탭/멀티디바이스 환경 지원을 위해 유저 전용 룸에 소켓을 조인시킵니다.
      await client.join(`user:${user.id}`);
      this.logger.log(`Client connected: ${client.id}, User ID: ${user.id}`);

      client.emit('connected', {
        message: '채팅 서버에 성공적으로 연결되었습니다.',
      });
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      client.emit('error', new WsException(error.message));
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.logger.log(
        `Client disconnected: ${client.id}, User ID: ${client.data.user.id}`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  /**
   * 특정 유저들의 모든 활성 소켓을 특정 채팅방 소켓 룸에 참여시킵니다.
   * ChatService에서 채팅방이 생성될 때 호출됩니다.
   * @param userIds - 룸에 참여시킬 유저 ID 배열
   * @param roomId - 참여할 룸 ID
   */
  joinRoom(userIds: number[], roomId: number): void {
    const roomIdStr = String(roomId);
    for (const userId of userIds) {
      this.server?.in(`user:${userId}`)?.socketsJoin(roomIdStr);
      this.logger.log(`All sockets of User ${userId} joined room ${roomIdStr}`);
    }
  }

  /**
   * 유저가 채팅방에 다시 참여했음을 알립니다.
   * ChatService에서 호출됩니다.
   */
  emitUserRejoined(roomId: number, message: ChatMessage) {
    this.server.to(String(roomId)).emit('userRejoined', {
      roomId,
      message,
    });
  }

  /**
   * 특정 유저의 모든 활성 기기/탭에 새로운 채팅방이 생성되었음을 알립니다.
   * @param userId - 알림을 받을 유저의 ID
   * @param room - 생성된 채팅방의 정보
   */
  notifyNewRoom(userId: number, room: ChatRoom) {
    this.server.to(`user:${userId}`).emit('newChatRoom', room);
    this.logger.log(`Notified user ${userId} of new room ${room.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { roomId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    const { roomId, content } = data;

    try {
      const message = await this.chatService.saveMessage(content, roomId, user);
      this.server.to(String(roomId)).emit('newMessage', message);
      return { status: 'ok', message };
    } catch (error) {
      this.logger.error(
        `Failed to save message for user ${user.id} in room ${roomId}: ${error.message}`,
      );
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('joinRooms')
  async handleJoinRooms(
    @MessageBody() roomIds: number[],
    @ConnectedSocket() client: Socket,
  ) {
    if (!Array.isArray(roomIds)) {
      throw new WsException(
        '유효하지 않은 roomIds입니다. 숫자 배열이어야 합니다.',
      );
    }
    const roomIdsAsStrings = roomIds.map(String);
    await client.join(roomIdsAsStrings);
    this.logger.log(
      `Client ${client.id} joined rooms: [${roomIdsAsStrings.join(', ')}]`,
    );
    return { status: 'ok', joinedRooms: roomIds };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    const { roomId } = data;
    try {
      const systemMessage = await this.chatService.leaveRoom(roomId, user.id);
      this.server.to(String(roomId)).emit('userLeft', {
        roomId,
        message: systemMessage,
      });
      await client.leave(String(roomId));
      this.logger.log(`User ${user.id} left room ${roomId}`);
      return {
        status: 'ok',
        message: `채팅방 ${roomId}에서 성공적으로 퇴장했습니다.`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to leave room ${roomId} for user ${user.id}: ${error.message}`,
      );
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('startTyping')
  handleStartTyping(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    client
      .to(String(data.roomId))
      .emit('typing', { nickname: user.nickname, isTyping: true });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    client
      .to(String(data.roomId))
      .emit('typing', { nickname: user.nickname, isTyping: false });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as User;
    const { roomId } = data;
    try {
      await this.chatService.markMessagesAsRead(roomId, user.id);
    } catch (error) {
      this.logger.error(
        `Failed to mark messages as read for user ${user.id} in room ${roomId}: ${error.message}`,
      );
    }
  }
}
