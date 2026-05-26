import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseMember } from '../entities/course-member.entity';
import { CourseMemberRole } from '../enums/course-member-role.enum';
import { CourseMemberStatus } from '../enums/course-member-status.enum';

export const COURSE_ROLES_KEY = 'courseRoles';

export const RequireCourseRole = (...roles: CourseMemberRole[]) =>
  SetMetadata(COURSE_ROLES_KEY, roles);

@Injectable()
export class CourseRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(CourseMember)
    private readonly memberRepo: Repository<CourseMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<CourseMemberRole[]>(
      COURSE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const courseId =
      request.params?.id ?? request.params?.courseId ?? request.body?.courseId;

    if (!courseId) {
      throw new ForbiddenException('Course context not found');
    }

    const member = await this.memberRepo.findOne({
      where: {
        userId,
        courseId: Number(courseId),
        status: CourseMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this course');
    }

    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException(
        `Required course role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
