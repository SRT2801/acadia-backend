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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
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
import { AuthenticatedUser } from '../../types/express';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly channelsService: ChannelsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions(PermissionsEnum.MANAGE_COURSE)
  @Post()
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires MANAGE_COURSE permission',
  })
  async create(@Body() dto: CreateCourseDto, @Req() req: Request) {
    const user = req['user'] as AuthenticatedUser | undefined;
    if (!user) {
      throw new Error('User not authenticated');
    }
    const result = await this.coursesService.create(dto, user.userId);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get all courses for current user' })
  @ApiResponse({ status: 200, description: 'List of courses' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(@Req() req: Request) {
    const user = req['user'] as AuthenticatedUser | undefined;
    if (!user) {
      throw new Error('User not authenticated');
    }
    const courses = await this.coursesService.findAll(user.userId);
    return { courses, total: (courses as Array<unknown>).length };
  }

  @UseGuards(JwtAuthGuard)
  @Get('join/:code')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Join a course by invitation code' })
  @ApiParam({ name: 'code', type: 'string', description: 'Invitation code' })
  @ApiResponse({ status: 200, description: 'Successfully joined course' })
  @ApiResponse({ status: 404, description: 'Invitation not found or expired' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async joinByCode(@Param('code') code: string, @Req() req: Request) {
    const user = req['user'] as AuthenticatedUser | undefined;
    if (!user) {
      throw new Error('User not authenticated');
    }
    const course = await this.coursesService.joinByCode(code, user.userId);
    return { course };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course data' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const course = await this.coursesService.findOne(id);
    return { course };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Patch(':id')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update course by ID (Owner or Professor only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Delete course by ID (Owner only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires no roles' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.coursesService.remove(id);
    return { message: 'Course deleted' };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/space')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get academic space for course' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Academic space data' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getSpace(@Param('id', ParseIntPipe) id: number) {
    const space = await this.coursesService.getSpace(id);
    return { space };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Patch(':id/space')
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Update academic space settings (Owner or Professor only)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Space updated successfully' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
  async updateSpace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpaceDto,
  ) {
    const space = await this.coursesService.updateSpace(id, dto);
    return { space };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/channels')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'List all channels and categories for course' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Channels and categories' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Create a new channel in course (Owner or Professor only)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Channel created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update channel (Owner or Professor only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiParam({ name: 'channelId', type: 'number', description: 'Channel ID' })
  @ApiResponse({ status: 200, description: 'Channel updated successfully' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Delete channel (Owner or Professor only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiParam({ name: 'channelId', type: 'number', description: 'Channel ID' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Reorder channels in course (Owner or Professor only)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Channels reordered successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
  async reorderChannels(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderChannelsDto,
  ) {
    const space = await this.coursesService.getSpace(id);
    await this.channelsService.reorderChannels(space.id, dto.channelIds);
    return { message: 'Channels reordered' };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Post(':id/categories')
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Create a category in course (Owner or Professor only)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update category (Owner or Professor only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiParam({ name: 'categoryId', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
  async updateCategory(
    @Param('id', ParseIntPipe) _courseId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.channelsService.updateCategory(categoryId, dto);
    return { category };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Delete(':id/categories/:categoryId')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Delete category (Owner or Professor only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiParam({ name: 'categoryId', type: 'number', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
  async deleteCategory(
    @Param('id', ParseIntPipe) _courseId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    await this.channelsService.deleteCategory(categoryId);
    return { message: 'Category deleted' };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/members')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'List all members of a course' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'List of course members' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async listMembers(@Param('id', ParseIntPipe) id: number) {
    const members = await this.coursesService.listMembers(id);
    return { members, total: (members as Array<unknown>).length };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Patch(':id/members/:memberId/role')
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Update member role in course (Owner or Professor only)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiParam({ name: 'memberId', type: 'number', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Remove member from course (Owner or Professor only)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiParam({ name: 'memberId', type: 'number', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    await this.coursesService.removeMember(id, memberId);
    return { message: 'Member removed' };
  }

  @UseGuards(JwtAuthGuard, CourseRoleGuard)
  @RequireCourseRole(CourseMemberRole.OWNER, CourseMemberRole.PROFESSOR)
  @Post(':id/invitations')
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Create an invitation for course (Owner or Professor only)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'List all invitations for course (Owner or Professor only)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
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
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Revoke an invitation (Owner or Professor only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiParam({
    name: 'invitationId',
    type: 'number',
    description: 'Invitation ID',
  })
  @ApiResponse({ status: 200, description: 'Invitation revoked successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires OWNER or PROFESSOR role in course',
  })
  async revokeInvitation(
    @Param('id', ParseIntPipe) id: number,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    await this.coursesService.revokeInvitation(invitationId, id);
    return { message: 'Invitation revoked' };
  }
}
