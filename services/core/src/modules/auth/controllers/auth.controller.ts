// import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { Throttle } from '@nestjs/throttler';
// import { Public } from '../../../common/decorators/public.decorator';
// import { AuthService } from '../services/auth.service';
// import { LoginDto } from '../dto/login.dto';
// import { RegisterDto } from '../dto/register.dto';
// import { RefreshTokenDto } from '../dto/refresh-token.dto';
// import { SendVerificationDto } from '../dto/send-verification.dto';
// import { VerifyOtpDto } from '../dto/verify-otp.dto';
// import type { Request, Response } from 'express';
// import { getCookie } from '../../../common/utils/cookie';
// import { UserRole } from '@prisma/client';

// @Controller('auth')
// export class AuthController {
//   constructor(
//     private readonly authService: AuthService,
//     private readonly config: ConfigService
//   ) {}

//   @Post('login')
//   @Public()
//   @Throttle({ auth: {} })
//   async login(
//     @Body() body: LoginDto,
//     @Req() req: Request,
//     @Res({ passthrough: true }) res: Response
//   ) {
//     const tokens = await this.authService.login(body, req.ip);
//     this.setAuthCookies(res, tokens);
//     const currentUser = await this.authService.getCurrentUser(tokens.userId);
//     return currentUser;
//   }

//   @Post('register')
//   @Public()
//   @Throttle({ auth: {} })
//   async register(
//     @Body() body: RegisterDto,
//     @Req() req: Request,
//     @Res({ passthrough: true }) res: Response
//   ) {
//     const tokens = await this.authService.register(body, req.ip);
//     this.setAuthCookies(res, tokens);
//     const currentUser = await this.authService.getCurrentUser(tokens.userId);
//     return currentUser;
//   }

//   @Post('refresh')
//   @Public()
//   @Throttle({ auth: {} })
//   async refresh(
//     @Body() body: RefreshTokenDto,
//     @Req() req: Request,
//     @Res({ passthrough: true }) res: Response
//   ) {
//     const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
//     const tokens = await this.authService.refreshTokens(
//       body.refreshToken ?? cookieToken ?? null,
//       req.ip
//     );
//     this.setAuthCookies(res, tokens);
//     const currentUser = await this.authService.getCurrentUser(tokens.userId);
//     return currentUser;
//   }

//   @Post('logout')
//   // async logout(
//   //   @Body() body: RefreshTokenDto,
//   //   @Req() req: Request,
//   //   @Res({ passthrough: true }) res: Response
//   // ) {
//   //   const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
//   //   await this.authService.revokeRefreshToken(
//   //     body.refreshToken ?? cookieToken ?? null,
//   //     req.ip
//   //   );
//   //   this.clearAuthCookies(res);
//   //   return { success: true };
//   // }
//   @Post('logout')
//   async logout(
//     @Req() req: Request,
//     @Res({ passthrough: true }) res: Response
//   ) {
//     console.log("🔥 RAW COOKIE HEADER:", req.headers.cookie);

//     const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
//     console.log("🔥 Parsed refresh_token:", cookieToken);

//     // stop logout here TEMPORARILY
//     return { debug: true };
//   }


//   @Get('me')
//   async me(@Req() req: Request) {
//     const authUser = req.user as { userId: string; role: UserRole } | undefined;
//     if (!authUser) {
//       return null;
//     }
//     return this.authService.getCurrentUser(authUser.userId);
//   }

//   @Post('verification/send')
//   @Public()
//   @Throttle({ auth: {} })
//   async sendVerification(@Body() body: SendVerificationDto) {
//     return this.authService.sendVerificationCode(body);
//   }

//   @Post('verification/verify')
//   @Public()
//   @Throttle({ auth: {} })
//   async verifyContact(@Body() body: VerifyOtpDto) {
//     return this.authService.verifyContactCode(body);
//   }

//   @Post('admin/login')
//   @Public()
//   @Throttle({ auth: {} })
//   async adminLogin(
//     @Body() body: LoginDto,
//     @Req() req: Request,
//     @Res({ passthrough: true }) res: Response
//   ) {
//     const tokens = await this.authService.login(body, req.ip);
//     const currentUser = await this.authService.getCurrentUser(tokens.userId);
//     const adminUser = this.ensureAdminUser(currentUser);
//     this.setAuthCookies(res, tokens);
//     return adminUser;
//   }

//   @Post('admin/refresh')
//   @Public()
//   @Throttle({ auth: {} })
//   async adminRefresh(
//     @Body() body: RefreshTokenDto,
//     @Req() req: Request,
//     @Res({ passthrough: true }) res: Response
//   ) {
//     const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
//     const tokens = await this.authService.refreshTokens(
//       body.refreshToken ?? cookieToken ?? null,
//       req.ip
//     );
//     const currentUser = await this.authService.getCurrentUser(tokens.userId);
//     const adminUser = this.ensureAdminUser(currentUser);
//     this.setAuthCookies(res, tokens);
//     return adminUser;
//   }

//   @Post('admin/logout')
//   async adminLogout(
//     @Body() body: RefreshTokenDto,
//     @Req() req: Request,
//     @Res({ passthrough: true }) res: Response
//   ) {
//     this.ensureAdminRequest(req);
//     const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
//     await this.authService.revokeRefreshToken(
//       body.refreshToken ?? cookieToken ?? null,
//       req.ip
//     );
//     this.clearAuthCookies(res);
//     return { success: true };
//   }

//   @Get('admin/me')
//   async adminMe(@Req() req: Request) {
//     const authUser = this.ensureAdminRequest(req);
//     const currentUser = await this.authService.getCurrentUser(authUser.userId);
//     return this.ensureAdminUser(currentUser);
//   }

//   private setAuthCookies(
//     res: Response,
//     tokens: { accessToken: string; refreshToken: string }
//   ) {
//     const secure = this.config.get<string>('NODE_ENV') === 'production';
//     const domain = this.resolveCookieDomain();
//     const accessTtl = this.parseDuration(
//       this.config.get<string>('jwt.accessTokenTtl') ?? '15m'
//     );
//     const refreshTtl = this.parseDuration(
//       this.config.get<string>('jwt.refreshTokenTtl') ?? '7d'
//     );

//     res.cookie('access_token', tokens.accessToken, {
//       httpOnly: true,
//       secure,
//       sameSite: 'lax',
//       maxAge: accessTtl,
//       domain,
      
//     });

//     res.cookie('refresh_token', tokens.refreshToken, {
//       httpOnly: true,
//       secure,
//       sameSite: 'lax',
//       maxAge: refreshTtl,
//       domain,
//     });
//   }





//   private clearAuthCookies(res: Response) {
//     const domain = this.resolveCookieDomain();
//     res.cookie('access_token', '', {
//       httpOnly: true,
//       secure: this.config.get<string>('NODE_ENV') === 'production',
//       sameSite: 'lax',
//       expires: new Date(0),
//       domain
//     });
//     res.cookie('refresh_token', '', {
//       httpOnly: true,
//       secure: this.config.get<string>('NODE_ENV') === 'production',
//       sameSite: 'lax',
//       expires: new Date(0),
//       domain,
//       path: '/auth'
//     });
//   }





//   private resolveCookieDomain() {
//     const configured = this.config.get<string>('security.cookieDomain')?.trim();
//     if (!configured) {
//       return undefined;
//     }
//     const normalized = configured.toLowerCase();
//     if (normalized === 'localhost' || normalized === '127.0.0.1') {
//       return undefined;
//     }
//     return configured;
//   }

//   private parseDuration(value: string) {
//     const match = /^(\d+)([smhd])$/i.exec(value.trim());
//     if (!match) {
//       return 0;
//     }
//     const amount = Number(match[1]);
//     const unit = match[2].toLowerCase();
//     const msMap: Record<string, number> = {
//       s: 1000,
//       m: 60 * 1000,
//       h: 60 * 60 * 1000,
//       d: 24 * 60 * 60 * 1000
//     };
//     return amount * (msMap[unit] ?? 0);
//   }

//   private ensureAdminRequest(req: Request) {
//     const authUser = req.user as { userId: string; role: UserRole } | undefined;
//     if (!authUser || authUser.role !== UserRole.admin) {
//       throw new UnauthorizedException('Admin access only');
//     }
//     return authUser;
//   }

//   private ensureAdminUser<T extends { role: UserRole } | null | undefined>(user: T) {
//     if (!user || user.role !== UserRole.admin) {
//       throw new UnauthorizedException('Admin access only');
//     }
//     return user;
//   }
// }



import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { SendVerificationDto } from '../dto/send-verification.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import type { CookieOptions, Request, Response } from 'express';
import { getCookie } from '../../../common/utils/cookie';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly config: ConfigService) { }

  @Post('login')
  @Public()
  @Throttle({ auth: {} })
  async login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(body, req.ip);
    this.setAuthCookies(res, tokens);
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    return currentUser;
  }

  @Post('register')
  @Public()
  @Throttle({ auth: {} })
  async register(@Body() body: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(body, req.ip);
    this.setAuthCookies(res, tokens);
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    return currentUser;
  }

  @Post('refresh')
  @Public()
  @Throttle({ auth: {} })
  async refresh(@Body() body: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
    const tokens = await this.authService.refreshTokens(body.refreshToken ?? cookieToken ?? null, req.ip);
    this.setAuthCookies(res, tokens);
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    return currentUser;
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = getCookie(req.headers.cookie, 'refresh_token');

    if (cookieToken) {
      try {
        await this.authService.revokeRefreshToken(cookieToken, req.ip);
      } catch { }
    }

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
  @Throttle({ auth: {} })
  async sendVerification(@Body() body: SendVerificationDto) {
    return this.authService.sendVerificationCode(body);
  }

  @Post('verification/verify')
  @Public()
  @Throttle({ auth: {} })
  async verifyContact(@Body() body: VerifyOtpDto) {
    return this.authService.verifyContactCode(body);
  }

  @Post('admin/login')
  @Public()
  @Throttle({ auth: {} })
  async adminLogin(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(body, req.ip);
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    const adminUser = this.ensureAdminUser(currentUser);
    this.setAuthCookies(res, tokens);
    return adminUser;
  }

  @Post('admin/refresh')
  @Public()
  @Throttle({ auth: {} })
  async adminRefresh(@Body() body: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
    const tokens = await this.authService.refreshTokens(body.refreshToken ?? cookieToken ?? null, req.ip);
    const currentUser = await this.authService.getCurrentUser(tokens.userId);
    const adminUser = this.ensureAdminUser(currentUser);
    this.setAuthCookies(res, tokens);
    return adminUser;
  }

  @Post('admin/logout')
  async adminLogout(@Body() body: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.ensureAdminRequest(req);
    const cookieToken = getCookie(req.headers.cookie, 'refresh_token');
    await this.authService.revokeRefreshToken(body.refreshToken ?? cookieToken ?? null, req.ip);
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
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const domain = this.resolveCookieDomain();
    const accessTtl = this.parseDuration(this.config.get<string>('jwt.accessTokenTtl') ?? '15m');
    const refreshTtl = this.parseDuration(this.config.get<string>('jwt.refreshTokenTtl') ?? '7d');

    const sameSite: 'none' | 'lax' = isProd ? 'none' : 'lax';

    const baseOpts: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      domain,
      path: '/'
    };

    res.cookie('access_token', tokens.accessToken, {
      ...baseOpts,
      maxAge: accessTtl
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      ...baseOpts,
      maxAge: refreshTtl
    });
  }



  private clearAuthCookies(res: Response) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const domain = this.resolveCookieDomain();

    // Explicit literal type so TS doesn't widen it to `string`
    const sameSite: 'none' | 'lax' = isProd ? 'none' : 'lax';

    const opts: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      domain,
      path: '/',
      expires: new Date(0)
    };

    res.clearCookie('access_token', opts);
    res.clearCookie('refresh_token', opts);

    // Extra explicit expired cookies (for stubborn browsers)
    res.cookie('access_token', '', opts);
    res.cookie('refresh_token', '', opts);
  }



  private resolveCookieDomain() {
    const configured = this.config.get<string>('security.cookieDomain')?.trim();
    if (!configured) {
      return undefined;
    }
    const normalized = configured.toLowerCase();
    if (normalized === 'localhost' || normalized === '127.0.0.1') {
      return undefined;
    }
    return configured;
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
