import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUniversityDto {
  @ApiProperty({
    description: 'University name',
    example: 'Universidad Nacional de Colombia',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'University domain', example: 'unal.edu.co' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  domain!: string;

  @ApiPropertyOptional({
    description: 'University logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Bogotá' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Colombia' })
  @IsOptional()
  @IsString()
  country?: string;
}
