import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { AnnouncementPriority } from '../entities/announcement.entity';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Announcement title',
    example: 'Important Notice',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'Announcement content',
    example: 'Please read this carefully',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  content!: string;

  @ApiPropertyOptional({
    description: 'Whether the announcement is pinned',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional({
    description: 'Announcement priority',
    enum: AnnouncementPriority,
    default: AnnouncementPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiProperty({ description: 'Channel ID', minimum: 1, example: 1 })
  @IsDefined()
  @IsInt()
  @Min(1)
  channelId!: number;
}
