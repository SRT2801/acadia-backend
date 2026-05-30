import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { instanceToPlain } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { SessionsService } from './sessions.service';

@Injectable()
export class AuthService {
  private readonly refreshTokenExpiryDays = 7;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
    private readonly sessionsService: SessionsService,
    private readonly mailService: MailService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepo: Repository<PasswordResetToken>,
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

    const verificationToken = randomBytes(32).toString('hex');
    const hashedVerificationToken = createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    await this.usersService.setVerificationToken(
      user.id,
      hashedVerificationToken,
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );

    await this.mailService.sendVerificationEmail(email, verificationToken);

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

    await this.sessionsService.touch(session.id);

    const { affected } = await this.refreshTokenRepo.update(
      { id: tokenEntity.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    if (affected === 0) {
      throw new UnauthorizedException('Refresh token already revoked');
    }

    const newRefreshTokenStr = randomBytes(40).toString('hex');
    const newHashedToken = createHash('sha256')
      .update(newRefreshTokenStr)
      .digest('hex');

    try {
      await this.refreshTokenRepo.save({
        token: newHashedToken,
        userId: user.id,
        sessionId: session.id,
        expiresAt: new Date(
          Date.now() + this.refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
        ),
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token conflict, please try again',
      );
    }

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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const email = forgotPasswordDto.email;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return;
    }

    await this.passwordResetTokenRepo.update(
      { email, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const tokenStr = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(tokenStr).digest('hex');

    await this.passwordResetTokenRepo.save({
      email,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await this.mailService.sendPasswordResetEmail(email, tokenStr);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const hashedToken = createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const tokenEntity = await this.passwordResetTokenRepo.findOne({
      where: {
        token: hashedToken,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!tokenEntity) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersService.findByEmail(tokenEntity.email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.usersService.update(user.id, { password: hashedPassword });

    await this.passwordResetTokenRepo.update(tokenEntity.id, {
      usedAt: new Date(),
    });

    await this.refreshTokenRepo.update(
      { userId: user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    await this.sessionsService.expireAllExcept(user.id, -1);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    const hashedToken = createHash('sha256')
      .update(verifyEmailDto.token)
      .digest('hex');

    const user = await this.usersService.findByVerificationToken(hashedToken);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.usersService.markEmailVerified(user.id);
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
