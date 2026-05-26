import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionsEnum } from '../roles/enums/permissions.enum';
import { CourseRoleGuard, RequireCourseRole } from './guards/course-role.guard';
import { CourseMemberRole } from './enums/course-member-role.enum';
import { CoursesService } from './courses.service';
import { ChannelsService } from '../channels/channels.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { ReorderChannelsDto } from './dto/reorder-channels.dto';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly channelsService: ChannelsService,
  ) {}

  // ── Course CRUD ──────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions(PermissionsEnum.MANAGE_COURSE)
  @Post()
  async create(@Body() dto: CreateCourseDto, @Req() req: Request) {
    const userId = req['user']?.userId;
    const course = await this.coursesService.create(dto, userId);
    return { course };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: Request) {
    const userId = req['user']?.userId;
    const courses = await this.coursesService.findAll(userId);
    return { courses, total: (courses as Array<unknown>).length };
  }

  @UseGuards(JwtAuthGuard)
  @Get('join/:code')
  async joinByCode(@Param('code') code: string, @Req() req: Request) {
    const userId = req['user']?.userId;
    const course = await this.coursesService.joinByCode(code, userId);
    return { course };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const course = await this.coursesService.findOne(id);
    return { course };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
  ) {
    const course = await this.coursesService.update(id, dto);
    return { course };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.coursesService.remove(id);
    return { message: 'Course deleted' };
  }

  // ── Academic Space ───────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id/space')
  async getSpace(@Param('id', ParseIntPipe) id: number) {
    const space = await this.coursesService.getSpace(id);
    return { space };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Patch(':id/space')
  async updateSpace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpaceDto,
  ) {
    const space = await this.coursesService.updateSpace(id, dto);
    return { space };
  }

  // ── Channels ─────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id/channels')
  async listChannels(@Param('id', ParseIntPipe) id: number) {
    const space = await this.coursesService.getSpace(id);
    const channels = await this.channelsService.findBySpaceId(space.id);
    const categories = await this.channelsService.findCategoriesBySpaceId(
      space.id,
    );

    return {
      channels: { items: channels, total: channels.length },
      categories: { items: categories, total: categories.length },
    };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Post(':id/channels')
  async createChannel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateChannelDto,
    @Req() req: Request,
  ) {
    const userId = req['user']?.userId;
    const space = await this.coursesService.getSpace(id);
    const channel = await this.channelsService.createChannel({
      ...dto,
      academicSpaceId: space.id,
      createdById: userId,
    });
    return { channel };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Patch(':id/channels/:channelId')
  async updateChannel(
    @Param('id', ParseIntPipe) _courseId: number,
    @Param('channelId', ParseIntPipe) channelId: number,
    @Body() dto: UpdateChannelDto,
  ) {
    const channel = await this.channelsService.updateChannel(channelId, dto);
    return { channel };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Delete(':id/channels/:channelId')
  async deleteChannel(
    @Param('id', ParseIntPipe) _courseId: number,
    @Param('channelId', ParseIntPipe) channelId: number,
  ) {
    await this.channelsService.deleteChannel(channelId);
    return { message: 'Channel deleted' };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Patch(':id/channels/reorder')
  async reorderChannels(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderChannelsDto,
  ) {
    const space = await this.coursesService.getSpace(id);
    await this.channelsService.reorderChannels(space.id, dto.channelIds);
    return { message: 'Channels reordered' };
  }

  // ── Categories ───────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Post(':id/categories')
  async createCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCategoryDto,
  ) {
    const space = await this.coursesService.getSpace(id);
    const category = await this.channelsService.createCategory({
      name: dto.name,
      academicSpaceId: space.id,
    });
    return { category };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Patch(':id/categories/:categoryId')
  async updateCategory(
    @Param('id', ParseIntPipe) _courseId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.channelsService.updateCategory(
      categoryId,
      dto,
    );
    return { category };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Delete(':id/categories/:categoryId')
  async deleteCategory(
    @Param('id', ParseIntPipe) _courseId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    await this.channelsService.deleteCategory(categoryId);
    return { message: 'Category deleted' };
  }

  // ── Members ──────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id/members')
  async listMembers(@Param('id', ParseIntPipe) id: number) {
    const members = await this.coursesService.listMembers(id);
    return { members, total: (members as Array<unknown>).length };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Patch(':id/members/:memberId/role')
  async updateMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const member = await this.coursesService.updateMemberRole(
      id,
      memberId,
      dto.role,
    );
    return { member };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    await this.coursesService.removeMember(id, memberId);
    return { message: 'Member removed' };
  }

  // ── Invitations ──────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Post(':id/invitations')
  async createInvitation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateInvitationDto,
    @Req() req: Request,
  ) {
    const userId = req['user']?.userId;
    const invitation = await this.coursesService.createInvitation(
      id,
      userId,
      dto.maxUses,
    );
    return { invitation };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/invitations')
  async listInvitations(@Param('id', ParseIntPipe) id: number) {
    const invitations = await this.coursesService.listInvitations(id);
    return {
      invitations,
      total: (invitations as Array<unknown>).length,
    };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Delete(':id/invitations/:invitationId')
  async revokeInvitation(
    @Param('id', ParseIntPipe) id: number,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    await this.coursesService.revokeInvitation(invitationId, id);
    return { message: 'Invitation revoked' };
  }
}
