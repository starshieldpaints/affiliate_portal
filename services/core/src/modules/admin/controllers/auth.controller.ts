import { Controller, Get, Post, Body, Res, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthService } from '../services/auth.service';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Post('login')
  async login(
    @Body() payload: { email: string; password: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.authService.login(payload.email, payload.password);
    // Stub cookies for demo; replace with real JWT/refresh tokens.
    res.cookie('access_token', 'demo', {
      httpOnly: true,
      sameSite: 'lax'
    });
    res.cookie('refresh_token', 'demo', {
      httpOnly: true,
      sameSite: 'lax'
    });
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return;
  }

  @Post('refresh')
  async refresh(@Res({ passthrough: true }) res: Response) {
    const user = await this.authService.me();
    res.cookie('access_token', 'demo', {
      httpOnly: true,
      sameSite: 'lax'
    });
    return user;
  }

  @Get('me')
  async me() {
    return this.authService.me();
  }
}
