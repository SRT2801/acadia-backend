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
import { ChannelType } from '../enums/channel-type.enum';

export class CreateChannelDto {
  @ApiProperty({
    description: 'Channel name',
    maxLength: 100,
    example: 'General Discussion',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Channel description',
    maxLength: 500,
    example: 'Main chat for course discussions',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Channel type',
    enum: ChannelType,
    example: ChannelType.TEXT,
  })
  @IsDefined()
  @IsEnum(ChannelType)
  type!: ChannelType;

  @ApiPropertyOptional({ description: 'Channel icon emoji', example: '💬' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Category ID', minimum: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Whether channel is locked',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
