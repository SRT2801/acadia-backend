import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesEnum } from './enums/roles.enum';
import { PermissionsEnum } from './enums/permissions.enum';

@ApiTags('Roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Roles(RolesEnum.ADMIN)
  @Get()
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get all roles (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  getAll() {
    return this.rolesService.findAll();
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.PROFESSOR)
  @Get('permissions')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get all permissions (Admin and Professor)' })
  @ApiResponse({
    status: 200,
    description: 'List of permissions',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Forbidden - requires ADMIN or PROFESSOR role',
  })
  getAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Roles(RolesEnum.ADMIN)
  @Get(':id')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get role by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role data' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findById(id);
  }

  @Roles(RolesEnum.ADMIN)
  @Post()
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create a new role (Admin only)' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  create(@Body('name') name: string) {
    return this.rolesService.create(name);
  }

  @Roles(RolesEnum.ADMIN)
  @Post(':id/permissions')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Assign permissions to a role (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissionIds') permissionIds: number[],
  ) {
    return this.rolesService.assignPermissions(id, permissionIds || []);
  }

  @Roles(RolesEnum.ADMIN)
  @Delete(':id/permissions/:permissionId')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Remove permission from role (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Role ID' })
  @ApiParam({
    name: 'permissionId',
    type: 'number',
    description: 'Permission ID',
  })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  @ApiResponse({ status: 404, description: 'Role or permission not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  removePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolesService.removePermission(id, permissionId);
  }
}
