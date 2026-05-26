import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { Course } from './entities/course.entity';
import { CourseMember } from './entities/course-member.entity';
import { Invitation } from './entities/invitation.entity';
import { AcademicSpacesService } from '../academic-spaces/academic-spaces.service';
import { ChannelsService } from '../channels/channels.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseMemberRole } from './enums/course-member-role.enum';
import { CourseMemberStatus } from './enums/course-member-status.enum';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseMember)
    private readonly memberRepo: Repository<CourseMember>,
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,
    private readonly academicSpacesService: AcademicSpacesService,
    private readonly channelsService: ChannelsService,
  ) {}

  async create(dto: CreateCourseDto, userId: number) {
    const existing = await this.courseRepo.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Course code already exists');
    }

    const course = this.courseRepo.create({
      ...dto,
      createdById: userId,
    });

    const saved = await this.courseRepo.save(course);

    const space = await this.academicSpacesService.createSpace({
      name: saved.name,
      courseId: saved.id,
      ownerId: userId,
    });

    const channels = await this.channelsService.createDefaultChannels(
      space.id,
      userId,
    );

    await this.memberRepo.save({
      userId,
      courseId: saved.id,
      role: CourseMemberRole.OWNER,
      status: CourseMemberStatus.ACTIVE,
    });

    const full = await this.findOne(saved.id);
    if (full.academicSpace) {
      full.academicSpace.channels = channels;
      full.academicSpace.categories = [];
    }

    return full;
  }

  async findAll(userId: number) {
    const memberCourseIds = await this.memberRepo
      .find({
        where: { userId, status: CourseMemberStatus.ACTIVE },
        select: ['courseId'],
      })
      .then((members) => members.map((m) => m.courseId));

    if (memberCourseIds.length === 0) {
      return [];
    }

    return this.courseRepo.find({
      where: memberCourseIds.map((id) => ({ id })),
      relations: ['university'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: [
        'university',
        'faculty',
        'career',
        'createdBy',
        'academicSpace',
      ],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async update(id: number, dto: UpdateCourseDto) {
    const course = await this.findOne(id);

    if (dto.code && dto.code !== course.code) {
      const existing = await this.courseRepo.findOne({
        where: { code: dto.code },
      });

      if (existing) {
        throw new ConflictException('Course code already exists');
      }
    }

    const merged = this.courseRepo.merge(course, dto);
    return this.courseRepo.save(merged);
  }

  async remove(id: number) {
    const course = await this.findOne(id);
    await this.courseRepo.remove(course);
  }

  async getSpace(courseId: number) {
    return this.academicSpacesService.findByCourseIdOrFail(courseId);
  }

  async updateSpace(
    courseId: number,
    data: { visibility?: any; settings?: Record<string, unknown> },
  ) {
    return this.academicSpacesService.updateSpace(courseId, data);
  }

  async listMembers(courseId: number) {
    return this.memberRepo.find({
      where: { courseId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async getMember(courseId: number, userId: number) {
    return this.memberRepo.findOne({
      where: { courseId, userId },
      relations: ['user'],
    });
  }

  async getMemberOrFail(courseId: number, userId: number) {
    const member = await this.getMember(courseId, userId);
    if (!member) {
      throw new NotFoundException('Member not found in course');
    }
    return member;
  }

  async joinByCode(code: string, userId: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { code },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation code');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new ForbiddenException('Invitation has expired');
    }

    if (invitation.maxUses > 0 && invitation.uses >= invitation.maxUses) {
      throw new ForbiddenException('Invitation has reached its usage limit');
    }

    const existingMember = await this.getMember(invitation.courseId, userId);

    if (existingMember) {
      if (existingMember.status === CourseMemberStatus.ACTIVE) {
        throw new ConflictException('Already a member of this course');
      }

      existingMember.status = CourseMemberStatus.ACTIVE;
      await this.memberRepo.save(existingMember);
    } else {
      await this.memberRepo.save({
        userId,
        courseId: invitation.courseId,
        role: CourseMemberRole.STUDENT,
        status: CourseMemberStatus.ACTIVE,
      });
    }

    await this.invitationRepo.increment({ id: invitation.id }, 'uses', 1);

    return this.findOne(invitation.courseId);
  }

  async createInvitation(courseId: number, createdById: number, maxUses = 0) {
    const code = randomBytes(3).toString('hex').toUpperCase();

    const invitation = this.invitationRepo.create({
      code,
      courseId,
      createdById,
      maxUses,
      uses: 0,
      expiresAt:
        maxUses > 0
          ? undefined
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return this.invitationRepo.save(invitation);
  }

  async listInvitations(courseId: number) {
    return this.invitationRepo.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeInvitation(invitationId: number, courseId: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId, courseId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.invitationRepo.remove(invitation);
  }

  async updateMemberRole(
    courseId: number,
    memberId: number,
    role: CourseMemberRole,
  ) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, courseId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === CourseMemberRole.OWNER) {
      throw new ForbiddenException(
        'Cannot change the role of the course owner',
      );
    }

    if (role === CourseMemberRole.OWNER) {
      throw new ForbiddenException('Cannot set role to OWNER');
    }

    member.role = role;
    return this.memberRepo.save(member);
  }

  async removeMember(courseId: number, memberId: number) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, courseId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === CourseMemberRole.OWNER) {
      throw new ForbiddenException('Cannot remove the course owner');
    }

    await this.memberRepo.remove(member);
  }
}
