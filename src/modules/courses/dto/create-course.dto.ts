import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  semester?: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  universityId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  facultyId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  careerId?: number;
}
