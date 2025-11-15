import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { SendVerificationDto } from '../dto/send-verification.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import type { Request, Response } from 'express';
import { getCookie } from '../../../common/utils/cookie';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService
  ) {}

  @Post('login')
  @Public()
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.login(body, req.ip);
    this.setAuthCookies(res, tokens);
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    return currentUser;
  }

  @Post('register')
  @Public()
  async register(
    @Body() body: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.register(body, req.ip);
    this.setAuthCookies(res, tokens);
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    return currentUser;
  }

  @Post('refresh')
  @Public()
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
    const tokens = await this.authService.refreshTokens(
      body.refreshToken ?? cookieToken ?? null,
      req.ip
    );
    this.setAuthCookies(res, tokens);
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    return currentUser;
  }

  @Post('logout')
  async logout(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
    await this.authService.revokeRefreshToken(
      body.refreshToken ?? cookieToken ?? null,
      req.ip
    );
    this.clearAuthCookies(res);
    return { success: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const authUser = req.user as { userId: string; role: UserRole } | undefined;
    if (!authUser) {
      return null;
    }
    return this.authService.getCurrentUser(authUser.userId);
  }

  @Post('verification/send')
  @Public()
  async sendVerification(@Body() body: SendVerificationDto) {
    return this.authService.sendVerificationCode(body);
  }

  @Post('verification/verify')
  @Public()
  async verifyContact(@Body() body: VerifyOtpDto) {
    return this.authService.verifyContactCode(body);
  }

  @Post('admin/login')
  @Public()
  async adminLogin(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.login(body, req.ip);
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    const adminUser = this.ensureAdminUser(currentUser);
    this.setAuthCookies(res, tokens);
    return adminUser;
  }

  @Post('admin/refresh')
  @Public()
  async adminRefresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
    const tokens = await this.authService.refreshTokens(
      body.refreshToken ?? cookieToken ?? null,
      req.ip
    );
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    const adminUser = this.ensureAdminUser(currentUser);
    this.setAuthCookies(res, tokens);
    return adminUser;
  }

  @Post('admin/logout')
  async adminLogout(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    this.ensureAdminRequest(req);
    const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
    await this.authService.revokeRefreshToken(
      body.refreshToken ?? cookieToken ?? null,
      req.ip
    );
    this.clearAuthCookies(res);
    return { success: true };
  }

  @Get('admin/me')
  async adminMe(@Req() req: Request) {
    const authUser = this.ensureAdminRequest(req);
    const currentUser = await this.authService.getCurrentUser(authUser.userId);
    return this.ensureAdminUser(currentUser);
  }

  private setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string }
  ) {
    const secure = this.config.get<string>('NODE_ENV') === 'production';
    const domain = this.config.get<string>('security.cookieDomain') || undefined;
    const accessTtl = this.parseDuration(
      this.config.get<string>('jwt.accessTokenTtl') ?? '15m'
    );
    const refreshTtl = this.parseDuration(
      this.config.get<string>('jwt.refreshTokenTtl') ?? '7d'
    );

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: accessTtl,
      domain
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: refreshTtl,
      domain,
      path: '/auth'
    });
  }

  private clearAuthCookies(res: Response) {
    const domain = this.config.get<string>('security.cookieDomain') || undefined;
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      domain
    });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      domain,
      path: '/auth'
    });
  }

  private parseDuration(value: string) {
    const match = /^(\d+)([smhd])$/i.exec(value.trim());
    if (!match) {
      return 0;
    }
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const msMap: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };
    return amount * (msMap[unit] ?? 0);
  }

  private ensureAdminRequest(req: Request) {
    const authUser = req.user as { userId: string; role: UserRole } | undefined;
    if (!authUser || authUser.role !== UserRole.admin) {
      throw new UnauthorizedException('Admin access only');
    }
    return authUser;
  }

  private ensureAdminUser<T extends { role: UserRole } | null | undefined>(user: T) {
    if (!user || user.role !== UserRole.admin) {
      throw new UnauthorizedException('Admin access only');
    }
    return user;
  }
}
