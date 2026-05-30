import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message content', example: 'Hello everyone!' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ description: 'Channel ID', minimum: 1, example: 1 })
  @IsDefined()
  @IsInt()
  @Min(1)
  channelId!: number;
}
