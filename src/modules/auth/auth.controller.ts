import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  ParseIntPipe,
  Param,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthService } from './auth.service';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests, try again later',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const { accessToken, refreshToken, user } = await this.authService.register(
      registerDto,
      ipAddress,
      userAgent,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { accessToken, user };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests, try again later',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const { accessToken, refreshToken, user } = await this.authService.login(
      loginDto,
      ipAddress,
      userAgent,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { accessToken, user };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshTokenCookie = req.cookies?.refreshToken;

    if (!refreshTokenCookie) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const { accessToken, refreshToken, user } =
      await this.authService.refresh(refreshTokenCookie);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { accessToken, user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req['user'];
    const refreshTokenCookie = req.cookies?.refreshToken;
    await this.authService.logout(user.sessionId, refreshTokenCookie);
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/auth' });
    return { message: 'Logged out successfully' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmail(verifyEmailDto);
    return { message: 'Email verified successfully' };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'If email exists, reset link sent' })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests, try again later',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password has been reset successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  me(@Req() req: Request) {
    return req['user'];
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiResponse({ status: 200, description: 'List of active sessions' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getSessions(@Req() req: Request) {
    const user = req['user'];
    return this.authService.getActiveSessions(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async revokeSession(
    @Req() req: Request,
    @Param('id', ParseIntPipe) sessionId: number,
  ) {
    const user = req['user'];
    await this.authService.revokeSession(sessionId, user.userId);
    return { message: 'Session revoked' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Revoke all sessions except current one' })
  @ApiResponse({ status: 200, description: 'Other sessions revoked' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async revokeOtherSessions(@Req() req: Request) {
    const user = req['user'];
    await this.authService.revokeOtherSessions(user.userId, user.sessionId);
    return { message: 'Other sessions revoked' };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    };
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      path: '/auth',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
}
