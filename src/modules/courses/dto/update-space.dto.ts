import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { Visibility } from '../enums/visibility.enum';

export class UpdateSpaceDto {
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
