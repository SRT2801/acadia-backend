import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ChannelsService } from '../channels/channels.service';
import { ChannelType } from '../courses/enums/channel-type.enum';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification-type.enum';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly channelsService: ChannelsService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => CoursesService))
    private readonly coursesService: CoursesService,
  ) {}

  async create(
    createMessageDto: CreateMessageDto & { userId: number },
  ): Promise<Message> {
    const channel = await this.channelsService.findOne(
      createMessageDto.channelId,
    );
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (channel.type !== ChannelType.TEXT) {
      throw new NotFoundException(
        'Messages can only be created in TEXT channels',
      );
    }

    const message = this.messageRepo.create({
      content: createMessageDto.content,
      channelId: createMessageDto.channelId,
      userId: createMessageDto.userId,
    });

    const savedMessage = await this.messageRepo.save(message);
    const messageWithUser = await this.messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: ['user'],
    });
    this.chatGateway.emitMessageCreated(
      createMessageDto.channelId,
      messageWithUser,
    );

    this.createMessageNotification(messageWithUser!, channel);

    return messageWithUser!;
  }

  private async createMessageNotification(
    message: Message,
    channel: any,
  ): Promise<void> {
    try {
      const channelWithSpace = await this.channelsService.findOne(
        message.channelId,
      );
      const academicSpace = channelWithSpace?.academicSpace;
      if (!academicSpace) return;

      const members = await this.getCourseMembers(academicSpace.courseId);

      const senderName = message.user
        ? `${message.user.firstName} ${message.user.lastName}`
        : 'Someone';

      for (const member of members) {
        if (member.userId === message.userId) continue;

        await this.notificationsService.create({
          type: NotificationType.MESSAGE,
          title: `Mensaje de ${senderName} en #${channel.name}`,
          body:
            message.content.length > 100
              ? message.content.slice(0, 100) + '...'
              : message.content,
          userId: member.userId,
          senderId: message.userId,
          senderName,
          channelId: message.channelId,
          channelName: channel.name,
          courseId: academicSpace.courseId,
          link: `/app/courses/${academicSpace.courseId}/channels/${message.channelId}`,
        });
      }
    } catch (error) {
      console.error('Failed to create message notification:', error);
    }
  }

  private async getCourseMembers(courseId: number): Promise<any[]> {
    try {
      const members = await this.coursesService.listMembers(courseId);
      return members || [];
    } catch {
      return [];
    }
  }

  async findByChannel(channelId: number): Promise<Message[]> {
    return this.messageRepo.find({
      where: { channelId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Message | null> {
    return this.messageRepo.findOne({
      where: { id },
      relations: ['user', 'channel'],
    });
  }

  async update(
    id: number,
    updateMessageDto: UpdateMessageDto,
    userId: number,
  ): Promise<Message> {
    const message = await this.messageRepo.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.userId !== userId) {
      throw new NotFoundException('Not authorized to edit this message');
    }

    if (updateMessageDto.content) {
      message.content = updateMessageDto.content;
    }

    const savedMessage = await this.messageRepo.save(message);
    this.chatGateway.emitMessageUpdated(message.channelId, savedMessage);
    return savedMessage;
  }

  async remove(id: number, userId: number): Promise<boolean> {
    const message = await this.messageRepo.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.userId !== userId) {
      throw new NotFoundException('Not authorized to delete this message');
    }

    const channelId = message.channelId;
    const result = await this.messageRepo.delete(id);
    if (result.affected) {
      this.chatGateway.emitMessageDeleted(channelId, id);
      return true;
    }
    return false;
  }

  async findByChannelIds(channelIds: number[]): Promise<Message[]> {
    if (channelIds.length === 0) return [];
    return this.messageRepo.find({
      where: { channelId: In(channelIds) },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }
}
