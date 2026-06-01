import {
  ConflictException,
  Controller,
  DefaultValuePipe,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesEnum } from '../roles/enums/roles.enum';
import { AuthenticatedUser } from '../../types/express';

@ApiTags('Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(RolesEnum.ADMIN)
  @Post()
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  async create(@Body() createUserDto: CreateUserDto) {
    const existingEmail = await this.usersService.findByEmail(
      createUserDto.email,
    );
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    return this.usersService.create(createUserDto);
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.PROFESSOR)
  @Get()
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get all users (Admin and Professor only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires ADMIN or PROFESSOR role',
  })
  findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.usersService.findAll(limit, offset);
  }

  @Patch('me')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updateProfile(@Req() req: Request, @Body() updateProfileDto: UpdateUserDto) {
    const user = req['user'];

    delete (updateProfileDto as Record<string, unknown>).roleId;
    delete (updateProfileDto as Record<string, unknown>).status;

    return this.usersService.update(user.userId, updateProfileDto);
  }

  @Get(':id')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(RolesEnum.ADMIN, RolesEnum.PROFESSOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Roles(RolesEnum.ADMIN)
  @Patch(':id')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(RolesEnum.ADMIN)
  @Delete(':id')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
