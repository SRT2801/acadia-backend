import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
