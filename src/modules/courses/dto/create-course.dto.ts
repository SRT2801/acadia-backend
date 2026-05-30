import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Course name',
    maxLength: 200,
    example: 'Introduction to Computer Science',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Course code',
    maxLength: 20,
    example: 'CS101',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({
    description: 'Course description',
    maxLength: 2000,
    example: 'Fundamentals of programming and algorithms',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Semester', example: '2024-1' })
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiProperty({ description: 'University ID', minimum: 1, example: 1 })
  @IsDefined()
  @IsInt()
  @Min(1)
  universityId!: number;

  @ApiPropertyOptional({ description: 'Faculty ID', minimum: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  facultyId?: number;

  @ApiPropertyOptional({ description: 'Career ID', minimum: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  careerId?: number;
}
