import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/features/user/services/user.service';
import { SocketAuthGuard } from '@/features/chat/guards/socket-auth.guard'; // Reusing existing guard
import { JwtPayload } from '@/features/auth/types/jwt-payload.type';

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

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) return client.disconnect(); // Guard handles detailed checks/errors usually, but connection phase needs manual check if guard doesn't block handshake directly (Gateway guards work on messages usually, but Connection phase can be manual)
      // *Correction*: NestJS Guards on Gateway *class* affect handshake? Often yes, but let's be safe.

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

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.connectedUsers.delete(client.data.user.id);
      this.logger.log(
        `Notification Client disconnected: User ID ${client.data.user.id}`,
      );
    }
  }

  sendNotification(recipientId: number, payload: any) {
    const socket = this.connectedUsers.get(recipientId);
    if (socket) {
      socket.emit('newNotification', payload);
      this.logger.log(`Sent notification to User ${recipientId}`);
    }
  }
}
