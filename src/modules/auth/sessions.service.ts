import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Session } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  async create(data: {
    userId: number;
    ipAddress?: string;
    userAgent?: string;
    deviceName?: string;
  }) {
    const session = this.sessionRepo.create({
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceName: data.deviceName,
      lastActiveAt: new Date(),
    });
    return this.sessionRepo.save(session);
  }

  async findById(id: number) {
    return this.sessionRepo.findOneBy({ id });
  }

  async findActiveByUser(userId: number) {
    return this.sessionRepo.find({
      where: { userId, expiredAt: IsNull() },
      order: { lastActiveAt: 'DESC' },
    });
  }

  async expire(id: number) {
    await this.sessionRepo.update(id, { expiredAt: new Date() });
  }

  async expireAllExcept(userId: number, excludeSessionId: number) {
    await this.sessionRepo
      .createQueryBuilder()
      .update(Session)
      .set({ expiredAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('id != :id', { id: excludeSessionId })
      .andWhere('expiredAt IS NULL')
      .execute();
  }

  async touch(id: number) {
    await this.sessionRepo.update(id, { lastActiveAt: new Date() });
  }
}
