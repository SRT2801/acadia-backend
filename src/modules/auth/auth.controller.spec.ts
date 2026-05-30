import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    roleId: 1,
    universityId: 1,
    permissions: [],
  };

  const mockReq = (overrides = {}): Request =>
    ({
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      cookies: {},
      ...overrides,
    }) as any;

  const mockRes = (): Response => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      verifyEmail: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      getActiveSessions: jest.fn(),
      revokeSession: jest.fn(),
      revokeOtherSessions: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should register a user and set auth cookies', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        universityId: 1,
      };

      authService.register.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      });

      const req = mockReq();
      const res = mockRes();

      await controller.register(dto, req, res);

      expect(authService.register).toHaveBeenCalledWith(
        dto,
        '127.0.0.1',
        'test-agent',
      );
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('login', () => {
    it('should login and set auth cookies', async () => {
      const dto = { email: 'test@test.com', password: 'password123' };

      authService.login.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      });

      const req = mockReq();
      const res = mockRes();

      await controller.login(dto, req, res);

      expect(authService.login).toHaveBeenCalledWith(
        dto,
        '127.0.0.1',
        'test-agent',
      );
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if no refresh token cookie', async () => {
      const req = mockReq({ cookies: {} });
      const res = mockRes();

      await expect(controller.refresh(req, res)).rejects.toThrow(
        'Refresh token not provided',
      );
    });

    it('should refresh tokens when cookie is present', async () => {
      authService.refresh.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: mockUser,
      });

      const req = mockReq({ cookies: { refreshToken: 'valid-refresh-token' } });
      const res = mockRes();

      await controller.refresh(req, res);

      expect(authService.refresh).toHaveBeenCalledWith('valid-refresh-token');
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('logout', () => {
    it('should logout and clear cookies', async () => {
      const req = mockReq({
        user: { sessionId: 1, userId: 1 },
        cookies: { refreshToken: 'refresh-token' },
      });
      const res = mockRes();

      await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith(1, 'refresh-token');
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const dto = { token: 'verification-token' };

      await controller.verifyEmail(dto);

      expect(authService.verifyEmail).toHaveBeenCalledWith(dto);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email', async () => {
      const dto = { email: 'test@test.com' };

      await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const dto = { token: 'reset-token', newPassword: 'newpassword123' };

      await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('me', () => {
    it('should return current user', () => {
      const req = mockReq({ user: mockUser });

      const result = controller.me(req);

      expect(result).toEqual(mockUser);
    });
  });

  describe('getSessions', () => {
    it('should return active sessions', async () => {
      const req = mockReq({ user: { userId: 1 } });
      const sessions = [
        { id: 1, userId: 1, lastActiveAt: new Date(), createdAt: new Date() },
      ];
      authService.getActiveSessions.mockResolvedValue(sessions);

      const result = await controller.getSessions(req);

      expect(authService.getActiveSessions).toHaveBeenCalledWith(1);
      expect(result).toEqual(sessions);
    });
  });

  describe('revokeSession', () => {
    it('should revoke a specific session', async () => {
      const req = mockReq({ user: { userId: 1 } });

      await controller.revokeSession(req, 2);

      expect(authService.revokeSession).toHaveBeenCalledWith(2, 1);
    });
  });

  describe('revokeOtherSessions', () => {
    it('should revoke all other sessions', async () => {
      const req = mockReq({ user: { userId: 1, sessionId: 1 } });

      await controller.revokeOtherSessions(req);

      expect(authService.revokeOtherSessions).toHaveBeenCalledWith(1, 1);
    });
  });
});
