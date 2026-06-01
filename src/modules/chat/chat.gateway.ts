import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  universityId?: number;
  roleId?: number;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:4200',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)?.token ||
        (client.handshake.query as Record<string, string>)?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') ?? '',
      });

      client.userId = payload.userId as number;
      client.universityId = payload.universityId as number;
      client.roleId = payload.roleId as number;

      client.join(`user:${payload.userId as number}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {
    // Cleanup if needed
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: number },
  ) {
    if (!client.userId) return;
    client.join(`channel:${data.channelId}`);
    return { event: 'joinedChannel', data: { channelId: data.channelId } };
  }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: number },
  ) {
    if (!client.userId) return;
    client.leave(`channel:${data.channelId}`);
    return { event: 'leftChannel', data: { channelId: data.channelId } };
  }

  emitMessageCreated(channelId: number, message: any) {
    this.server.to(`channel:${channelId}`).emit('message:created', message);
  }

  emitMessageUpdated(channelId: number, message: any) {
    this.server.to(`channel:${channelId}`).emit('message:updated', message);
  }

  emitMessageDeleted(channelId: number, messageId: number) {
    this.server
      .to(`channel:${channelId}`)
      .emit('message:deleted', { id: messageId });
  }

  emitAnnouncementCreated(channelId: number, announcement: any) {
    this.server
      .to(`channel:${channelId}`)
      .emit('announcement:created', announcement);
  }

  emitAnnouncementUpdated(channelId: number, announcement: any) {
    this.server
      .to(`channel:${channelId}`)
      .emit('announcement:updated', announcement);
  }

  emitAnnouncementDeleted(channelId: number, announcementId: number) {
    this.server.to(`channel:${channelId}`).emit('announcement:deleted', {
      id: announcementId,
    });
  }

  emitAnnouncementPinned(channelId: number, announcement: any) {
    this.server
      .to(`channel:${channelId}`)
      .emit('announcement:pinned', announcement);
  }

  emitNotificationCreated(userId: number, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:created', notification);
  }
}
