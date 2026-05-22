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
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesEnum } from './enums/roles.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Roles(RolesEnum.ADMIN)
  @Get()
  getAll() {
    return this.rolesService.findAll();
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.PROFESSOR)
  @Get('permissions')
  getAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Roles(RolesEnum.ADMIN)
  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findById(id);
  }

  @Roles(RolesEnum.ADMIN)
  @Post()
  create(@Body('name') name: string) {
    return this.rolesService.create(name);
  }

  @Roles(RolesEnum.ADMIN)
  @Post(':id/permissions')
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissionIds') permissionIds: number[],
  ) {
    return this.rolesService.assignPermissions(id, permissionIds || []);
  }

  @Roles(RolesEnum.ADMIN)
  @Delete(':id/permissions/:permissionId')
  removePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolesService.removePermission(id, permissionId);
  }
}
