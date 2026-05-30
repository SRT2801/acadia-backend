import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { Visibility } from '../enums/visibility.enum';

export class UpdateSpaceDto {
  @ApiPropertyOptional({
    description: 'Space visibility',
    enum: Visibility,
    example: Visibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional({
    description: 'Additional space settings',
    example: { allowGuests: true },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
