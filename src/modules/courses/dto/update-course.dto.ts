import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  semester?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  facultyId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  careerId?: number;
}
