import {
  IsDefined,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class CreateUserDto {
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
  password!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsDefined()
  @IsString()
  avatar?: string;

  @IsDefined()
  @IsString()
  bio?: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  roleId!: number;

  @IsDefined()
  @IsInt()
  @Min(1)
  universityId!: number;
}
