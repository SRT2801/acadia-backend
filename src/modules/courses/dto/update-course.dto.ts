import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ description: 'Course name', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Course code', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ description: 'Course description', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Semester', example: '2024-1' })
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiPropertyOptional({ description: 'Faculty ID', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  facultyId?: number;

  @ApiPropertyOptional({ description: 'Career ID', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  careerId?: number;
}
