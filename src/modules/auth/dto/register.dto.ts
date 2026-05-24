import {
  IsDefined,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsDefined()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  universityId?: number;
}
