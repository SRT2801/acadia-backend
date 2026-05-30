import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { MailService } from '../mail/mail.service';
import { SessionsService } from './sessions.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let rolesService: jest.Mocked<RolesService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let mailService: jest.Mocked<MailService>;
  let refreshTokenRepo: jest.Mocked<Repository<RefreshToken>>;
  let passwordResetTokenRepo: jest.Mocked<Repository<PasswordResetToken>>;

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    roleId: 1,
    universityId: 1,
    status: 'ACTIVE',
    emailVerifiedAt: undefined,
    verificationToken: undefined,
    verificationTokenExpiresAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockSession = {
    id: 1,
    userId: 1,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    lastActiveAt: new Date(),
    createdAt: new Date(),
    expiredAt: undefined,
  };

  const mockRefreshToken = {
    id: 1,
    token: 'hashed-token',
    userId: 1,
    sessionId: 1,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    revokedAt: undefined,
  } as RefreshToken;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      setVerificationToken: jest.fn(),
      findByVerificationToken: jest.fn(),
      markEmailVerified: jest.fn(),
      update: jest.fn(),
    } as any;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    } as any;

    rolesService = {
      getPermissionsForRole: jest.fn().mockResolvedValue([]),
    } as any;

    sessionsService = {
      create: jest.fn().mockResolvedValue(mockSession),
      findById: jest.fn(),
      touch: jest.fn(),
      expire: jest.fn(),
      expireAllExcept: jest.fn(),
    } as any;

    mailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    } as any;

    refreshTokenRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      save: jest.fn().mockImplementation((data) => ({ id: 2, ...data })),
    } as any;

    passwordResetTokenRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn().mockImplementation((data) => ({ id: 1, ...data })),
      createQueryBuilder: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RolesService, useValue: rolesService },
        { provide: SessionsService, useValue: sessionsService },
        { provide: MailService, useValue: mailService },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepo,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: passwordResetTokenRepo,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          universityId: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and generate tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register(
        {
          email: 'test@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          universityId: 1,
        },
        '127.0.0.1',
        'test-agent',
      );

      expect(usersService.create).toHaveBeenCalled();
      expect(usersService.setVerificationToken).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@test.com',
        expect.any(String),
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on successful login', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login(
        { email: 'test@test.com', password: 'password123' },
        '127.0.0.1',
        'test-agent',
      );

      expect(sessionsService.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      refreshTokenRepo.findOne.mockResolvedValue({
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should rotate tokens on valid refresh', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(mockRefreshToken);
      sessionsService.findById.mockResolvedValue(mockSession);
      usersService.findOne.mockResolvedValue(mockUser);
      rolesService.getPermissionsForRole.mockResolvedValue(['CREATE_TASK']);

      const result = await service.refresh('valid-token');

      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockRefreshToken.id }),
        { revokedAt: expect.any(Date) },
      );
      expect(refreshTokenRepo.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('forgotPassword', () => {
    it('should silently return if email not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'notfound@test.com' }),
      ).resolves.not.toThrow();
    });

    it('should create reset token and send email', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      passwordResetTokenRepo.update.mockResolvedValue({ affected: 0 } as any);

      await service.forgotPassword({ email: 'test@test.com' });

      expect(passwordResetTokenRepo.save).toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@test.com',
        expect.any(String),
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token is invalid', async () => {
      passwordResetTokenRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'invalid',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password and revoke all sessions', async () => {
      passwordResetTokenRepo.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        token: 'hashed',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: undefined,
        createdAt: new Date(),
      });
      usersService.findByEmail.mockResolvedValue(mockUser);

      await service.resetPassword({
        token: 'valid-token',
        newPassword: 'newpassword123',
      });

      expect(usersService.update).toHaveBeenCalledWith(1, {
        password: 'hashed-password',
      });
      expect(passwordResetTokenRepo.update).toHaveBeenCalled();
      expect(refreshTokenRepo.update).toHaveBeenCalled();
      expect(sessionsService.expireAllExcept).toHaveBeenCalledWith(1, -1);
    });
  });

  describe('verifyEmail', () => {
    it('should throw BadRequestException if token is invalid', async () => {
      usersService.findByVerificationToken.mockResolvedValue(null);

      await expect(
        service.verifyEmail({ token: 'invalid-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if token is expired', async () => {
      usersService.findByVerificationToken.mockResolvedValue({
        ...mockUser,
        verificationTokenExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.verifyEmail({ token: 'expired-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify email successfully', async () => {
      usersService.findByVerificationToken.mockResolvedValue({
        ...mockUser,
        verificationTokenExpiresAt: new Date(Date.now() + 3600000),
      });

      await service.verifyEmail({ token: 'valid-token' });

      expect(usersService.markEmailVerified).toHaveBeenCalledWith(1);
    });
  });
});
