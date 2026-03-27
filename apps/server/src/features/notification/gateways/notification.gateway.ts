import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JwtPayload } from '@/features/auth/types/jwt-payload.type';
import { SocketAuthGuard } from '@/features/chat/guards/socket-auth.guard'; // Reusing existing guard
import { UserService } from '@/features/user/services/user.service';

@UseGuards(SocketAuthGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_DOMAIN ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'notification',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<number, Socket> = new Map();
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  /**
   * 클라이언트 소켓 연결 시 처리
   * JWT 토큰을 검증하고 사용자 정보를 소켓 세션에 저장합니다.
   *
   * @param client 연결된 소켓 클라이언트
   */
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) return client.disconnect();

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) return client.disconnect();

      client.data.user = user;
      this.connectedUsers.set(user.id, client);
      this.logger.log(
        `Notification Client connected: ${client.id}, User ID: ${user.id}`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.disconnect();
    }
  }

  /**
   * 클라이언트 소켓 연결 해제 시 처리
   * 접속자 목록에서 사용자를 제거합니다.
   *
   * @param client 연결 해제된 소켓 클라이언트
   */
  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.connectedUsers.delete(client.data.user.id);
      this.logger.log(
        `Notification Client disconnected: User ID ${client.data.user.id}`,
      );
    }
  }

  /**
   * 특정 사용자에게 실시간 알림을 전송합니다.
   * 사용자가 현재 접속 중(connectedUsers)일 경우에만 전송됩니다.
   *
   * @param recipientId 수신자 ID
   * @param payload 전송할 알림 데이터
   */
  sendNotification(recipientId: number, payload: any) {
    const socket = this.connectedUsers.get(recipientId);
    if (socket) {
      socket.emit('newNotification', payload);
      this.logger.log(`Sent notification to User ${recipientId}`);
    }
  }
}
