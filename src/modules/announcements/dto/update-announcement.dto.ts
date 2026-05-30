import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { AnnouncementPriority } from '../entities/announcement.entity';

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({
    description: 'Announcement title',
    example: 'Updated Title',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({
    description: 'Announcement content',
    example: 'Updated content',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    description: 'Whether the announcement is pinned',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional({
    description: 'Announcement priority',
    enum: AnnouncementPriority,
  })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;
}
