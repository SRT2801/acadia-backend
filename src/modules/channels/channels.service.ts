import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelCategory } from './entities/channel-category.entity';
import { ChannelType } from '../courses/enums/channel-type.enum';

const DEFAULT_CHANNELS = [
  { name: 'anuncios', type: ChannelType.ANNOUNCEMENT, icon: '📣' },
  { name: 'general', type: ChannelType.TEXT, icon: '💬' },
  { name: 'tareas', type: ChannelType.TASKS, icon: '📋' },
  { name: 'recursos', type: ChannelType.RESOURCES, icon: '📁' },
  { name: 'preguntas', type: ChannelType.FORUM, icon: '🗨️' },
];

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepo: Repository<Channel>,
    @InjectRepository(ChannelCategory)
    private readonly categoryRepo: Repository<ChannelCategory>,
  ) {}

  async createDefaultChannels(
    academicSpaceId: number,
    createdById: number,
  ): Promise<Channel[]> {
    const channels: Channel[] = [];

    for (let i = 0; i < DEFAULT_CHANNELS.length; i++) {
      const ch = this.channelRepo.create({
        ...DEFAULT_CHANNELS[i],
        position: i,
        academicSpaceId,
        createdById,
      });
      channels.push(await this.channelRepo.save(ch));
    }

    return channels;
  }

  async findBySpaceId(academicSpaceId: number): Promise<Channel[]> {
    return this.channelRepo.find({
      where: { academicSpaceId },
      relations: ['category'],
      order: { position: 'ASC' },
    });
  }

  async findOne(channelId: number): Promise<Channel | null> {
    return this.channelRepo.findOne({
      where: { id: channelId },
      relations: ['category'],
    });
  }

  async findOneOrFail(channelId: number): Promise<Channel> {
    const channel = await this.findOne(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }
    return channel;
  }

  async createChannel(data: {
    name: string;
    description?: string;
    type: ChannelType;
    icon?: string;
    categoryId?: number;
    isLocked?: boolean;
    academicSpaceId: number;
    createdById: number;
  }): Promise<Channel> {
    const maxPosition = await this.channelRepo.maximum('position', {
      academicSpaceId: data.academicSpaceId,
      categoryId: data.categoryId ?? undefined,
    });

    const channel = this.channelRepo.create({
      ...data,
      position: (maxPosition ?? -1) + 1,
    });

    return this.channelRepo.save(channel);
  }

  async updateChannel(
    channelId: number,
    data: {
      name?: string;
      description?: string;
      type?: ChannelType;
      icon?: string;
      categoryId?: number;
      isLocked?: boolean;
    },
  ): Promise<Channel> {
    const channel = await this.findOneOrFail(channelId);
    const merged = this.channelRepo.merge(channel, data);
    return this.channelRepo.save(merged);
  }

  async deleteChannel(channelId: number): Promise<void> {
    await this.channelRepo.delete(channelId);
  }

  async reorderChannels(
    academicSpaceId: number,
    channelIds: number[],
  ): Promise<void> {
    for (let i = 0; i < channelIds.length; i++) {
      await this.channelRepo.update(
        { id: channelIds[i], academicSpaceId },
        { position: i },
      );
    }
  }

  async findCategoriesBySpaceId(
    academicSpaceId: number,
  ): Promise<ChannelCategory[]> {
    return this.categoryRepo.find({
      where: { academicSpaceId },
      relations: ['channels'],
      order: { position: 'ASC' },
    });
  }

  async createCategory(data: {
    name: string;
    academicSpaceId: number;
  }): Promise<ChannelCategory> {
    const maxPosition = await this.categoryRepo.maximum('position', {
      academicSpaceId: data.academicSpaceId,
    });

    const category = this.categoryRepo.create({
      ...data,
      position: (maxPosition ?? -1) + 1,
    });

    return this.categoryRepo.save(category);
  }

  async updateCategory(
    categoryId: number,
    data: { name?: string },
  ): Promise<ChannelCategory> {
    const category = await this.categoryRepo.findOneByOrFail({
      id: categoryId,
    });
    const merged = this.categoryRepo.merge(category, data);
    return this.categoryRepo.save(merged);
  }

  async deleteCategory(categoryId: number): Promise<void> {
    await this.channelRepo.update({ categoryId }, { categoryId: undefined });
    await this.categoryRepo.delete(categoryId);
  }
}
