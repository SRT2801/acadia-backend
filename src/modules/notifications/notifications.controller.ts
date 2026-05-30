import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('accessToken')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = req['user'].userId;
    return this.notificationsService.findByUserId(userId, limit ? +limit : 50);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@Req() req: Request) {
    const userId = req['user'].userId;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: Request) {
    const userId = req['user'].userId;
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    const userId = req['user'].userId;
    const notification = await this.notificationsService.markAsRead(+id, userId);
    return { notification };
  }

  @Patch('channel/:channelId/read')
  @ApiOperation({ summary: 'Mark all notifications for a channel as read' })
  @ApiResponse({ status: 200, description: 'Channel notifications marked as read' })
  async markChannelAsRead(@Param('channelId') channelId: string, @Req() req: Request) {
    const userId = req['user'].userId;
    await this.notificationsService.markChannelNotificationsAsRead(userId, +channelId);
    return { success: true };
  }
}