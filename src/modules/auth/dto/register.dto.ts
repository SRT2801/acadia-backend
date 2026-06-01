import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
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
    maxLength: 128,
    example: 'Password123!',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
    {
      message:
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)',
    },
  )
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

  @ApiPropertyOptional({ description: 'University ID', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  universityId?: number;
}
