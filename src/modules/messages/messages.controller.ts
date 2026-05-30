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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@ApiTags('Messages')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('accessToken')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({ status: 201, description: 'Message created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or not a TEXT channel',
  })
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].userId;
    return this.messagesService.create({ ...createMessageDto, userId });
  }

  @Get('channel/:channelId')
  @ApiOperation({ summary: 'Get all messages in a channel' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async findByChannel(@Param('channelId') channelId: string) {
    return this.messagesService.findByChannel(+channelId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by ID' })
  @ApiResponse({ status: 200, description: 'Message data' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({
    status: 404,
    description: 'Message not found or not authorized',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].userId;
    return this.messagesService.update(+id, updateMessageDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({
    status: 404,
    description: 'Message not found or not authorized',
  })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = req['user'].userId;
    return this.messagesService.remove(+id, userId);
  }
}
