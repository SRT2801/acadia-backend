import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnnouncementsService } from './announcements.service';
import {
  Announcement,
  AnnouncementPriority,
} from './entities/announcement.entity';
import { ChannelsService } from '../channels/channels.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ChannelType } from '../courses/enums/channel-type.enum';
import { NotFoundException } from '@nestjs/common';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let announcementRepo: jest.Mocked<Repository<Announcement>>;
  let channelsService: jest.Mocked<ChannelsService>;
  let chatGateway: jest.Mocked<ChatGateway>;

  beforeEach(async () => {
    announcementRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as any;

    channelsService = {
      findOne: jest.fn(),
    } as any;

    chatGateway = {
      emitAnnouncementCreated: jest.fn(),
      emitAnnouncementUpdated: jest.fn(),
      emitAnnouncementDeleted: jest.fn(),
      emitAnnouncementPinned: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        {
          provide: getRepositoryToken(Announcement),
          useValue: announcementRepo,
        },
        { provide: ChannelsService, useValue: channelsService },
        { provide: ChatGateway, useValue: chatGateway },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if channel not found', async () => {
      channelsService.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Test',
          content: 'Content',
          channelId: 1,
          userId: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if channel is not ANNOUNCEMENT type', async () => {
      channelsService.findOne.mockResolvedValue({
        id: 1,
        type: ChannelType.TEXT,
      } as any);

      await expect(
        service.create({
          title: 'Test',
          content: 'Content',
          channelId: 1,
          userId: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create an announcement and emit event', async () => {
      const channel = { id: 1, type: ChannelType.ANNOUNCEMENT } as any;
      const announcement = {
        id: 1,
        title: 'Test',
        content: 'Content',
        pinned: false,
        priority: AnnouncementPriority.NORMAL,
        channelId: 1,
        userId: 1,
      };
      channelsService.findOne.mockResolvedValue(channel);
      announcementRepo.create.mockReturnValue(announcement as any);
      announcementRepo.save.mockResolvedValue(announcement as any);

      const result = await service.create({
        title: 'Test',
        content: 'Content',
        channelId: 1,
        userId: 1,
      });

      expect(announcementRepo.create).toHaveBeenCalled();
      expect(announcementRepo.save).toHaveBeenCalled();
      expect(chatGateway.emitAnnouncementCreated).toHaveBeenCalledWith(
        1,
        announcement,
      );
      expect(result).toEqual(announcement);
    });
  });

  describe('findByChannel', () => {
    it('should return announcements for a channel', async () => {
      const announcements = [{ id: 1 }, { id: 2 }];
      announcementRepo.find.mockResolvedValue(announcements as any);

      const result = await service.findByChannel(1);

      expect(announcementRepo.find).toHaveBeenCalledWith({
        where: { channelId: 1 },
        relations: ['user'],
        order: { pinned: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual(announcements);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if announcement not found', async () => {
      announcementRepo.findOne.mockResolvedValue(null);

      await expect(service.update(1, { title: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update announcement and emit event', async () => {
      const announcement = {
        id: 1,
        title: 'Old',
        content: 'Content',
        pinned: false,
        priority: AnnouncementPriority.NORMAL,
        channelId: 1,
      };
      announcementRepo.findOne.mockResolvedValue(announcement as any);
      announcementRepo.save.mockResolvedValue({
        ...announcement,
        title: 'Updated',
      } as any);

      const result = await service.update(1, { title: 'Updated' });

      expect(chatGateway.emitAnnouncementUpdated).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      );
      expect(result.title).toBe('Updated');
    });
  });

  describe('togglePin', () => {
    it('should toggle pin status and emit event', async () => {
      const announcement = { id: 1, pinned: false, channelId: 1 };
      announcementRepo.findOne.mockResolvedValue(announcement as any);
      announcementRepo.save.mockResolvedValue({
        ...announcement,
        pinned: true,
      } as any);

      const result = await service.togglePin(1);

      expect(chatGateway.emitAnnouncementPinned).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      );
      expect(result.pinned).toBe(true);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if announcement not found', async () => {
      announcementRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });

    it('should delete announcement and emit event', async () => {
      const announcement = { id: 1, channelId: 1 };
      announcementRepo.findOne.mockResolvedValue(announcement as any);
      announcementRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove(1);

      expect(chatGateway.emitAnnouncementDeleted).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });
});
