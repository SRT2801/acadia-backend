import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsArray, ArrayNotEmpty, IsInt, Min } from 'class-validator';

export class ReorderChannelsDto {
  @ApiProperty({
    description: 'Array of channel IDs in desired order',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsDefined()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  channelIds!: number[];
}
