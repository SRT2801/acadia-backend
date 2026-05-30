import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsNotEmpty } from 'class-validator';
import { CourseMemberRole } from '../enums/course-member-role.enum';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New course member role',
    enum: CourseMemberRole,
    example: CourseMemberRole.STUDENT,
  })
  @IsDefined()
  @IsEnum(CourseMemberRole)
  @IsNotEmpty()
  role!: CourseMemberRole;
}
