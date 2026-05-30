import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { ChannelsService } from '../channels/channels.service';
import { ChannelType } from '../courses/enums/channel-type.enum';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    private readonly channelsService: ChannelsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async create(
    createAnnouncementDto: CreateAnnouncementDto & { userId: number },
  ): Promise<Announcement> {
    const channel = await this.channelsService.findOne(
      createAnnouncementDto.channelId,
    );
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (channel.type !== ChannelType.ANNOUNCEMENT) {
      throw new NotFoundException(
        'Announcements can only be created in ANNOUNCEMENT channels',
      );
    }

    const announcement = this.announcementRepo.create({
      title: createAnnouncementDto.title,
      content: createAnnouncementDto.content,
      pinned: createAnnouncementDto.pinned ?? false,
      priority: createAnnouncementDto.priority,
      channelId: createAnnouncementDto.channelId,
      userId: createAnnouncementDto.userId,
    });

    const savedAnnouncement = await this.announcementRepo.save(announcement);
    this.chatGateway.emitAnnouncementCreated(
      createAnnouncementDto.channelId,
      savedAnnouncement,
    );
    return savedAnnouncement;
  }

  async findByChannel(channelId: number): Promise<Announcement[]> {
    return this.announcementRepo.find({
      where: { channelId },
      relations: ['user'],
      order: { pinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Announcement | null> {
    return this.announcementRepo.findOne({
      where: { id },
      relations: ['user', 'channel'],
    });
  }

  async update(
    id: number,
    updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (updateAnnouncementDto.title !== undefined) {
      announcement.title = updateAnnouncementDto.title;
    }
    if (updateAnnouncementDto.content !== undefined) {
      announcement.content = updateAnnouncementDto.content;
    }
    if (updateAnnouncementDto.pinned !== undefined) {
      announcement.pinned = updateAnnouncementDto.pinned;
    }
    if (updateAnnouncementDto.priority !== undefined) {
      announcement.priority = updateAnnouncementDto.priority;
    }

    const savedAnnouncement = await this.announcementRepo.save(announcement);
    this.chatGateway.emitAnnouncementUpdated(
      announcement.channelId,
      savedAnnouncement,
    );
    return savedAnnouncement;
  }

  async togglePin(id: number): Promise<Announcement> {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    announcement.pinned = !announcement.pinned;
    const savedAnnouncement = await this.announcementRepo.save(announcement);
    this.chatGateway.emitAnnouncementPinned(
      announcement.channelId,
      savedAnnouncement,
    );
    return savedAnnouncement;
  }

  async remove(id: number): Promise<boolean> {
    const announcement = await this.announcementRepo.findOne({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    const channelId = announcement.channelId;
    const result = await this.announcementRepo.delete(id);
    if (result.affected) {
      this.chatGateway.emitAnnouncementDeleted(channelId, id);
      return true;
    }
    return false;
  }
}
