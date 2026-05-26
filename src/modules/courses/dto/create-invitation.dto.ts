import { IsOptional, IsInt, Min } from 'class-validator';

export class CreateInvitationDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  maxUses?: number;
}
