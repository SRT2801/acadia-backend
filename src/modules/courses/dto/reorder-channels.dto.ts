import { IsDefined, IsArray, ArrayNotEmpty, IsInt, Min } from 'class-validator';

export class ReorderChannelsDto {
  @IsDefined()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  channelIds!: number[];
}
