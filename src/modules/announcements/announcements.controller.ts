import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesEnum } from '../roles/enums/roles.enum';

@ApiTags('Announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiCookieAuth('accessToken')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Roles(RolesEnum.PROFESSOR, RolesEnum.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new announcement (Professor/Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Announcement created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or not an ANNOUNCEMENT channel',
  })
  async create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].userId;
    return this.announcementsService.create({
      ...createAnnouncementDto,
      userId,
    });
  }

  @Get('channel/:channelId')
  @ApiOperation({ summary: 'Get all announcements in a channel' })
  @ApiResponse({ status: 200, description: 'List of announcements' })
  async findByChannel(@Param('channelId') channelId: string) {
    return this.announcementsService.findByChannel(+channelId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an announcement by ID' })
  @ApiResponse({ status: 200, description: 'Announcement data' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(+id);
  }

  @Roles(RolesEnum.PROFESSOR, RolesEnum.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an announcement (Professor/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Announcement updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(+id, updateAnnouncementDto);
  }

  @Roles(RolesEnum.PROFESSOR, RolesEnum.ADMIN)
  @Patch(':id/pin')
  @ApiOperation({ summary: 'Toggle pin status (Professor/Admin only)' })
  @ApiResponse({ status: 200, description: 'Pin status toggled' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async togglePin(@Param('id') id: string) {
    return this.announcementsService.togglePin(+id);
  }

  @Roles(RolesEnum.PROFESSOR, RolesEnum.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an announcement (Professor/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Announcement deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async remove(@Param('id') id: string) {
    return this.announcementsService.remove(+id);
  }
}
