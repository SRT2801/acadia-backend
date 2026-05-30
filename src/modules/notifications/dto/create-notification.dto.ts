import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, IsString } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  senderId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  channelId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  courseId?: number;
}