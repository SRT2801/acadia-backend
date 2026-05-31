import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RedisNotificationsService, NotificationResponse } from './redis-notifications.service';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  userId: number;
  senderId?: number;
  senderName?: string;
  channelId?: number;
  channelName?: string;
  courseId?: number;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly redisNotificationsService: RedisNotificationsService) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const result = await this.redisNotificationsService.pushNotification(createDto);
    return {
      id: result.id,
      type: result.type,
      title: result.title,
      body: result.body,
      userId: createDto.userId,
      senderId: result.senderId ?? createDto.senderId,
      senderName: result.senderName ?? createDto.senderName,
      channelId: result.channelId ?? createDto.channelId,
      channelName: result.channelName ?? createDto.channelName,
      courseId: result.courseId ?? createDto.courseId,
      link: result.link,
      isRead: result.isRead,
      createdAt: new Date(result.createdAt),
    };
  }

  async findByUserId(userId: number, limit = 50): Promise<Notification[]> {
    const notifications = await this.redisNotificationsService.getNotifications(userId, limit);
    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      userId,
      senderId: n.senderId,
      senderName: n.senderName,
      channelId: n.channelId,
      channelName: n.channelName,
      courseId: n.courseId,
      link: n.link,
      isRead: n.isRead,
      createdAt: new Date(n.createdAt),
    }));
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.redisNotificationsService.getUnreadCount(userId);
  }

  async markAsRead(id: number, userId: number): Promise<Notification | null> {
    await this.redisNotificationsService.markAsRead(userId, String(id));
    return null;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.redisNotificationsService.markAllAsRead(userId);
  }

  async markChannelNotificationsAsRead(userId: number, channelId: number): Promise<void> {
    await this.redisNotificationsService.markChannelAsRead(userId, channelId);
  }

  async deleteOldNotifications(daysOld = 30): Promise<number> {
    return 0;
  }
}
