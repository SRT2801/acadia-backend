import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsDefined()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'User password',
    minLength: 8,
    example: 'Password123!',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'User biography',
    example: 'Computer Science student',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'User status message',
    example: 'Studying for exams',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: string;

  @ApiProperty({ description: 'Role ID', minimum: 1, example: 2 })
  @IsDefined()
  @IsInt()
  @Min(1)
  roleId!: number;

  @ApiPropertyOptional({ description: 'University ID', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  universityId?: number;
}
