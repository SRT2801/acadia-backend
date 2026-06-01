import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateNotificationDto } from './dto/create-notification.dto';

export class NotificationsConfig {
  static readonly INTERNAL_API_KEY =
    process.env.INTERNAL_API_KEY ?? 'acadia-internal-secret-key-2026';
}

export interface NotificationResponse {
  success: boolean;
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    senderId?: number;
    senderName?: string;
    channelId?: number;
    channelName?: string;
    courseId?: number;
    link?: string;
    isRead: boolean;
    createdAt: string;
  };
}

export interface NotificationListResponse {
  notifications: NotificationResponse['notification'][];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

@Injectable()
export class RedisNotificationsService {
  private readonly logger = new Logger(RedisNotificationsService.name);
  private readonly redisUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_HTTP_PORT', 4002);
    this.redisUrl = `http://${host}:${port}`;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Redis request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  async pushNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponse['notification']> {
    try {
      const payload = {
        userId: dto.userId,
        notification: {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: dto.type,
          title: dto.title,
          body: dto.body,
          senderId: dto.senderId,
          senderName: dto.senderName,
          channelId: dto.channelId,
          channelName: dto.channelName,
          courseId: dto.courseId,
          link: dto.link,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      };

      const response = await this.request<NotificationResponse>(
        `${this.redisUrl}/notifications/internal/push`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'x-internal-api-key': NotificationsConfig.INTERNAL_API_KEY,
          },
        },
      );

      return response.notification;
    } catch (error) {
      this.logger.error(
        `Failed to push notification to Redis: ${error.message}`,
      );
      throw error;
    }
  }

  async getNotifications(
    userId: number,
    limit = 50,
  ): Promise<NotificationResponse['notification'][]> {
    try {
      const response = await this.request<{
        notifications: NotificationResponse['notification'][];
        total: number;
      }>(`${this.redisUrl}/notifications/internal/${userId}?limit=${limit}`, {
        headers: {
          'x-internal-api-key': NotificationsConfig.INTERNAL_API_KEY,
        },
      });
      return response.notifications;
    } catch (error) {
      this.logger.error(
        `Failed to get notifications from Redis: ${error.message}`,
      );
      throw error;
    }
  }

  async getUnreadCount(userId: number): Promise<number> {
    try {
      const response = await this.request<UnreadCountResponse>(
        `${this.redisUrl}/notifications/internal/${userId}/unread-count`,
        {
          headers: {
            'x-internal-api-key': NotificationsConfig.INTERNAL_API_KEY,
          },
        },
      );
      return response.count;
    } catch (error) {
      this.logger.error(
        `Failed to get unread count from Redis: ${error.message}`,
      );
      throw error;
    }
  }

  async markAsRead(userId: number, notificationId: string): Promise<void> {
    try {
      await this.request(
        `${this.redisUrl}/notifications/internal/${userId}/read/${notificationId}`,
        {
          method: 'PATCH',
          headers: {
            'x-internal-api-key': NotificationsConfig.INTERNAL_API_KEY,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark notification as read in Redis: ${error.message}`,
      );
      throw error;
    }
  }

  async markAllAsRead(userId: number): Promise<void> {
    try {
      await this.request(
        `${this.redisUrl}/notifications/internal/${userId}/read-all`,
        {
          method: 'PATCH',
          headers: {
            'x-internal-api-key': NotificationsConfig.INTERNAL_API_KEY,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read in Redis: ${error.message}`,
      );
      throw error;
    }
  }

  async markChannelAsRead(userId: number, channelId: number): Promise<void> {
    try {
      await this.request(
        `${this.redisUrl}/notifications/internal/${userId}/channel/${channelId}/read`,
        {
          method: 'PATCH',
          headers: {
            'x-internal-api-key': NotificationsConfig.INTERNAL_API_KEY,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark channel notifications as read in Redis: ${error.message}`,
      );
      throw error;
    }
  }
}
