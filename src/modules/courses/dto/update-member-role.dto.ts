import { IsDefined, IsEnum, IsNotEmpty } from 'class-validator';
import { CourseMemberRole } from '../enums/course-member-role.enum';

export class UpdateMemberRoleDto {
  @IsDefined()
  @IsEnum(CourseMemberRole)
  @IsNotEmpty()
  role!: CourseMemberRole;
}
