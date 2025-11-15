import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Req,
  Res
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { randomUUID } from 'crypto';
import { Public } from '../../common/decorators/public.decorator';
import { getCookie } from '../../common/utils/cookie';
import { TrackingService } from './tracking.service';

const CLICK_COOKIE_NAME = 'af_click';
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Controller('r')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly configService: ConfigService
  ) {}

  @Get(':code')
  @Public()
  async handleRedirect(@Param('code') code: string, @Req() req: Request, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException('Missing link code');
    }

    const link = await this.trackingService.findLinkByCode(code);
    const fallbackUrl =
      this.configService.get<string>('tracking.fallbackUrl') ??
      this.configService.get<string>('app.url') ??
      'https://starshieldpaints.com';

    if (!link || !link.isActive) {
      return res.redirect(fallbackUrl);
    }

    const cookieId = this.ensureCookie(req, res);

    await this.trackingService.recordClick({
      affiliateLinkId: link.id,
      cookieId,
      sessionId: this.getSessionId(req),
      userAgent: req.headers['user-agent'],
      ipAddress: this.getIpAddress(req),
      referrer: req.get('referer') ?? req.get('referrer') ?? null,
      utm: this.extractUtm(req)
    });

    const targetUrl = link.landingUrl ?? fallbackUrl;
    return res.redirect(targetUrl);
  }

  private ensureCookie(req: Request, res: Response) {
    const existing = getCookie(req.headers.cookie, CLICK_COOKIE_NAME);
    if (existing) {
      return existing;
    }
    const cookieId = randomUUID();
    const domain = this.configService.get<string>('security.cookieDomain') || undefined;
    res.cookie(CLICK_COOKIE_NAME, cookieId, {
      maxAge: COOKIE_MAX_AGE_MS,
      httpOnly: false,
      sameSite: 'lax',
      secure: this.configService.get('NODE_ENV') === 'production',
      domain
    });
    return cookieId;
  }

  private getSessionId(req: Request) {
    const headerSession = req.get('x-session-id');
    const querySession = (req.query.session_id ?? req.query.session) as string | undefined;
    return headerSession ?? querySession ?? null;
  }

  private getIpAddress(req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0];
    }
    return req.socket.remoteAddress ?? null;
  }

  private extractUtm(req: Request) {
    const query = req.query ?? {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const utm: Record<string, string> = {};
    utmKeys.forEach((key) => {
      const value = query[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        utm[key] = value.trim();
      }
    });
    return Object.keys(utm).length > 0 ? utm : undefined;
  }
}
