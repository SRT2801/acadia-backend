import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';

export class CreateInvitationDto {
  @ApiPropertyOptional({
    description: 'Maximum number of uses (0 for unlimited)',
    minimum: 0,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxUses?: number;
}
