import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create(createDto);
    return this.notificationRepo.save(notification);
  }

  async findByUserId(userId: number, limit = 50): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number): Promise<Notification | null> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) return null;

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async markChannelNotificationsAsRead(
    userId: number,
    channelId: number,
  ): Promise<void> {
    await this.notificationRepo.update(
      { userId, channelId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async deleteOldNotifications(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('isRead = true')
      .execute();

    return result.affected ?? 0;
  }
}