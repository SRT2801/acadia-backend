import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUniversityDto {
  @ApiProperty({
    description: 'University name',
    example: 'Universidad Nacional de Colombia',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'University domain', example: 'unal.edu.co' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  domain!: string;

  @ApiPropertyOptional({
    description: 'University logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Bogotá' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Colombia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}
