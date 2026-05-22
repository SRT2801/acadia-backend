import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { instanceToPlain } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshToken } from './entities/refresh-token.entity';
import { SessionsService } from './sessions.service';

@Injectable()
export class AuthService {
  private readonly refreshTokenExpiryDays = 7;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
    private readonly sessionsService: SessionsService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
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
      roleId: 1,
    });

    return this.generateTokens(user, ipAddress, userAgent);
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
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

    return this.generateTokens(user, ipAddress, userAgent);
  }

  async refresh(refreshTokenStr: string) {
    const hashedToken = createHash('sha256')
      .update(refreshTokenStr)
      .digest('hex');

    const tokenEntity = await this.refreshTokenRepo.findOne({
      where: { token: hashedToken, revokedAt: IsNull() },
    });

    if (!tokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const session = await this.sessionsService.findById(tokenEntity.sessionId);

    if (!session || session.expiredAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    const user = await this.usersService.findOne(tokenEntity.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.refreshTokenRepo.update(tokenEntity.id, {
      revokedAt: new Date(),
    });

    await this.sessionsService.touch(session.id);

    const newRefreshTokenStr = randomBytes(40).toString('hex');
    const newHashedToken = createHash('sha256')
      .update(newRefreshTokenStr)
      .digest('hex');

    await this.refreshTokenRepo.save({
      token: newHashedToken,
      userId: user.id,
      sessionId: session.id,
      expiresAt: new Date(
        Date.now() + this.refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
      ),
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      universityId: user.universityId,
      sessionId: session.id,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const permissions = user.roleId
      ? await this.rolesService.getPermissionsForRole(user.roleId)
      : [];

    return {
      accessToken,
      refreshToken: newRefreshTokenStr,
      user: { ...instanceToPlain(user), permissions },
    };
  }

  async logout(sessionId: number, refreshTokenStr?: string) {
    if (refreshTokenStr) {
      const hashedToken = createHash('sha256')
        .update(refreshTokenStr)
        .digest('hex');

      await this.refreshTokenRepo.update(
        { token: hashedToken },
        { revokedAt: new Date() },
      );
    }

    await this.sessionsService.expire(sessionId);
  }

  async getActiveSessions(userId: number) {
    return this.sessionsService.findActiveByUser(userId);
  }

  async revokeSession(sessionId: number, userId: number) {
    const session = await this.sessionsService.findById(sessionId);

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session not found');
    }

    await this.refreshTokenRepo.update(
      { sessionId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    await this.sessionsService.expire(sessionId);
  }

  async revokeOtherSessions(userId: number, currentSessionId: number) {
    await this.refreshTokenRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('sessionId != :sessionId', { sessionId: currentSessionId })
      .andWhere('revokedAt IS NULL')
      .execute();

    await this.sessionsService.expireAllExcept(userId, currentSessionId);
  }

  private async generateTokens(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const session = await this.sessionsService.create({
      userId: user.id,
      ipAddress,
      userAgent,
    });

    const refreshTokenStr = randomBytes(40).toString('hex');
    const hashedToken = createHash('sha256')
      .update(refreshTokenStr)
      .digest('hex');

    await this.refreshTokenRepo.save({
      token: hashedToken,
      userId: user.id,
      sessionId: session.id,
      expiresAt: new Date(
        Date.now() + this.refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
      ),
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      universityId: user.universityId,
      sessionId: session.id,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const permissions = user.roleId
      ? await this.rolesService.getPermissionsForRole(user.roleId)
      : [];

    return {
      accessToken,
      refreshToken: refreshTokenStr,
      user: { ...instanceToPlain(user), permissions },
    };
  }
}
