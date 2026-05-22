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
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesEnum } from '../roles/enums/roles.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(RolesEnum.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(RolesEnum.ADMIN, RolesEnum.PROFESSOR)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Ruta para que el usuario actualize su propio perfil
  // IMPORTANTE: Debe ir antes que el ':id' para que la URL /users/me no sea tomada como ID "me"
  @Patch('me')
  updateProfile(@Req() req: Request, @Body() updateProfileDto: UpdateUserDto) {
    const currentUserId = req['user'].userId;

    // Filtramos campos sensibles para evitar que un estudiante se asigne rol de ADMIN a sí mismo
    delete updateProfileDto.roleId;
    delete updateProfileDto.status;

    return this.usersService.update(currentUserId, updateProfileDto);
  }

  // Al no tener @Roles(), permitimos que CUALQUIER usuario autenticado vea un perfil.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Roles(RolesEnum.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Roles(RolesEnum.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
