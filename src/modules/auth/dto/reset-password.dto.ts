import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token from email',
    example: 'abc123def456...',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    description: 'New password',
    minLength: 8,
    maxLength: 128,
    example: 'NewPassword123!',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
