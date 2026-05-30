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
    origin: '*',
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
        client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token as string, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.userId;
      client.universityId = payload.universityId;
      client.roleId = payload.roleId;

      client.join(`user:${payload.userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
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
}
