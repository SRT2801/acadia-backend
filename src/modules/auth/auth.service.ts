import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email ?? '';
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password ?? '', 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      status: registerDto.status ?? 'ACTIVE',
      roleId: 1, // ID por defecto para "STUDENT" - Evita el Role Hijacking
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email ?? '';
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password ?? '',
      user.password ?? '',
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: User) {
    const payload: JwtPayload = {
      userId: user.id ?? 0,
      email: user.email ?? '',
      roleId: user.roleId ?? 0,
      universityId: user.universityId ?? 0,
    };

    const permissions = user.roleId
      ? await this.rolesService.getPermissionsForRole(user.roleId)
      : [];

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: { ...user, permissions },
    };
  }
}
