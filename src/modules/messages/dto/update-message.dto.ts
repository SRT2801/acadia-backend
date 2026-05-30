import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty({
    description: 'Updated message content',
    example: 'Updated content',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: 'Channel ID', minimum: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  channelId?: number;
}
