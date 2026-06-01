import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { ChannelsService } from '../channels/channels.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ChannelType } from '../courses/enums/channel-type.enum';
import { NotFoundException } from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageRepo: jest.Mocked<Repository<Message>>;
  let channelsService: jest.Mocked<ChannelsService>;
  let chatGateway: jest.Mocked<ChatGateway>;

  beforeEach(async () => {
    messageRepo = {
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
      emitMessageCreated: jest.fn(),
      emitMessageUpdated: jest.fn(),
      emitMessageDeleted: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Message), useValue: messageRepo },
        { provide: ChannelsService, useValue: channelsService },
        { provide: ChatGateway, useValue: chatGateway },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if channel not found', async () => {
      channelsService.findOne.mockResolvedValue(null);

      await expect(
        service.create({ content: 'Hello', channelId: 1, userId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if channel is not TEXT type', async () => {
      channelsService.findOne.mockResolvedValue({
        id: 1,
        type: ChannelType.ANNOUNCEMENT,
      } as any);

      await expect(
        service.create({ content: 'Hello', channelId: 1, userId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a message and emit event', async () => {
      const channel = { id: 1, type: ChannelType.TEXT } as any;
      const message = {
        id: 1,
        content: 'Hello',
        channelId: 1,
        userId: 1,
      };
      channelsService.findOne.mockResolvedValue(channel);
      messageRepo.create.mockReturnValue(message as any);
      messageRepo.save.mockResolvedValue(message as any);

      const result = await service.create({
        content: 'Hello',
        channelId: 1,
        userId: 1,
      });

      expect(messageRepo.create).toHaveBeenCalledWith({
        content: 'Hello',
        channelId: 1,
        userId: 1,
      });
      expect(messageRepo.save).toHaveBeenCalled();
      expect(chatGateway.emitMessageCreated).toHaveBeenCalledWith(1, message);
      expect(result).toEqual(message);
    });
  });

  describe('findByChannel', () => {
    it('should return messages for a channel', async () => {
      const messages = [{ id: 1 }, { id: 2 }];
      messageRepo.find.mockResolvedValue(messages as any);

      const result = await service.findByChannel(1);

      expect(messageRepo.find).toHaveBeenCalledWith({
        where: { channelId: 1 },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(messages);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if message not found', async () => {
      messageRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, { content: 'Updated' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user is not the author', async () => {
      messageRepo.findOne.mockResolvedValue({ id: 1, userId: 2 } as any);

      await expect(
        service.update(1, { content: 'Updated' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update message and emit event', async () => {
      const message = { id: 1, userId: 1, channelId: 1, content: 'Old' };
      messageRepo.findOne.mockResolvedValue(message as any);
      messageRepo.save.mockResolvedValue({
        ...message,
        content: 'Updated',
      } as any);

      const result = await service.update(1, { content: 'Updated' }, 1);

      expect(chatGateway.emitMessageUpdated).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      );
      expect(result.content).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if message not found', async () => {
      messageRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user is not the author', async () => {
      messageRepo.findOne.mockResolvedValue({ id: 1, userId: 2 } as any);

      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should delete message and emit event', async () => {
      const message = { id: 1, userId: 1, channelId: 1 };
      messageRepo.findOne.mockResolvedValue(message as any);
      messageRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove(1, 1);

      expect(chatGateway.emitMessageDeleted).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });
});
