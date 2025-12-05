// import {
//   BadRequestException,
//   Controller,
//   Get,
//   Param,
//   Req,
//   Res
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { Response, Request } from 'express';
// import { randomUUID } from 'crypto';
// import { Public } from '../../common/decorators/public.decorator';
// import { getCookie } from '../../common/utils/cookie';
// import { TrackingService } from './tracking.service';

// const CLICK_COOKIE_NAME = 'af_click';
// const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; 

// @Controller('r')
// export class TrackingController {
//   constructor(
//     private readonly trackingService: TrackingService,
//     private readonly configService: ConfigService
//   ) {}

//   @Get(':code')
//   @Public()
//   async handleRedirect(@Param('code') code: string, @Req() req: Request, @Res() res: Response) {
//     if (!code) {
//       throw new BadRequestException('Missing link code');
//     }

//     const link = await this.trackingService.findLinkByCode(code);
//     const fallbackUrl =
//       this.configService.get<string>('tracking.fallbackUrl') ??
//       this.configService.get<string>('app.url') ??
//       'https://starshieldpaints.com';

//     if (!link || !link.isActive) {
//       return res.redirect(fallbackUrl);
//     }

//     const targetUrl = link.landingUrl ?? fallbackUrl;
//     if (this.isPreviewCrawler(req.headers['user-agent'])) {
//       return res
//         .status(200)
//         .type('html')
//         .send(
//           this.renderPreviewPage(
//             targetUrl,
//             link.product?.name,
//             link.product?.description,
//             link.product?.imageUrl
//           )
//         );
//     }

//     const cookieId = this.ensureCookie(req, res);

//     await this.trackingService.recordClick({
//       affiliateLinkId: link.id,
//       cookieId,
//       sessionId: this.getSessionId(req),
//       userAgent: req.headers['user-agent'],
//       ipAddress: this.getIpAddress(req),
//       referrer: req.get('referer') ?? req.get('referrer') ?? null,
//       utm: this.extractUtm(req)
//     });

//     return res.redirect(targetUrl);
//   }

//   private ensureCookie(req: Request, res: Response) {
//     const existing = getCookie(req.headers.cookie, CLICK_COOKIE_NAME);
//     if (existing) {
//       return existing;
//     }
//     const cookieId = randomUUID();
//     const domain = this.configService.get<string>('security.cookieDomain') || undefined;
//     res.cookie(CLICK_COOKIE_NAME, cookieId, {
//       maxAge: COOKIE_MAX_AGE_MS,
//       httpOnly: false,
//       sameSite: 'lax',
//       secure: this.configService.get('NODE_ENV') === 'production',
//       domain
//     });
//     return cookieId;
//   }

//   private getSessionId(req: Request) {
//     const headerSession = req.get('x-session-id');
//     const querySession = (req.query.session_id ?? req.query.session) as string | undefined;
//     return headerSession ?? querySession ?? null;
//   }

//   private getIpAddress(req: Request) {
//     const forwarded = req.headers['x-forwarded-for'];
//     if (typeof forwarded === 'string') {
//       return forwarded.split(',')[0].trim();
//     }
//     if (Array.isArray(forwarded) && forwarded.length > 0) {
//       return forwarded[0];
//     }
//     return req.socket.remoteAddress ?? null;
//   }

//   private extractUtm(req: Request) {
//     const query = req.query ?? {};
//     const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
//     const utm: Record<string, string> = {};
//     utmKeys.forEach((key) => {
//       const value = query[key];
//       if (typeof value === 'string' && value.trim().length > 0) {
//         utm[key] = value.trim();
//       }
//     });
//     return Object.keys(utm).length > 0 ? utm : undefined;
//   }

//   private isPreviewCrawler(userAgent?: string | string[]) {
//     if (!userAgent) return false;
//     const ua = Array.isArray(userAgent) ? userAgent.join(' ') : userAgent;
//     const crawlers = [
//       'facebookexternalhit',
//       'Facebot',
//       'Twitterbot',
//       'Slackbot',
//       'WhatsApp',
//       'LinkedInBot',
//       'TelegramBot',
//       'Discordbot'
//     ];
//     return crawlers.some((needle) => ua.toLowerCase().includes(needle.toLowerCase()));
//   }

//   private renderPreviewPage(
//     targetUrl: string,
//     title?: string | null,
//     description?: string | null,
//     imageUrl?: string | null
//   ) {
//     const safe = (value?: string | null, fallback = '') =>
//       (value ?? fallback)
//         .replace(/&/g, '&amp;')
//         .replace(/</g, '&lt;')
//         .replace(/>/g, '&gt;')
//         .replace(/"/g, '&quot;')
//         .trim();
//     const resolvedTitle = safe(title, 'StarShield Product');
//     const resolvedDescription = safe(description, 'Check out this product from StarShield.');
//     const resolvedImage = imageUrl ? safe(imageUrl) : '';
//     const resolvedUrl = safe(targetUrl);
//     return `<!doctype html>
// <html lang="en">
//   <head>
//     <meta charset="utf-8" />
//     <meta http-equiv="X-UA-Compatible" content="IE=edge" />
//     <meta name="viewport" content="width=device-width, initial-scale=1" />
//     <title>${resolvedTitle}</title>
//     <meta property="og:title" content="${resolvedTitle}" />
//     <meta property="og:description" content="${resolvedDescription}" />
//     <meta property="og:url" content="${resolvedUrl}" />
//     <meta property="og:type" content="product" />
//     ${resolvedImage ? `<meta property="og:image" content="${resolvedImage}" />` : ''}
//     <meta name="twitter:card" content="${resolvedImage ? 'summary_large_image' : 'summary'}" />
//     <meta http-equiv="refresh" content="0;url='${resolvedUrl}'" />
//   </head>
//   <body>
//     <p>Redirecting to <a href="${resolvedUrl}">${resolvedUrl}</a>…</p>
//   </body>
// </html>`;
//   }
// }





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
import { PrismaService } from '../prisma/prisma.service'; // Needed for variant lookup

const CLICK_COOKIE_NAME = 'af_click';
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

@Controller('r')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) { }

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

    let targetUrl = link.landingUrl ?? fallbackUrl;

    // ============================================================
    // CRITICAL FIX: Append Tracking Parameters for Shopify
    // ============================================================
    try {
      const urlObj = new URL(targetUrl);

      // 1. Pass the Affiliate Code (Shopify looks for 'ref' or 'aff')
      urlObj.searchParams.set('ref', link.code);

      // 2. Pass UTM Parameters (For Shopify Analytics / GA4)
      // We cast the JSON type to a Record to access fields safely
      const utms = link.utmDefaults as Record<string, string> | null;
      if (utms) {
        if (utms.source) urlObj.searchParams.set('utm_source', utms.source);
        if (utms.medium) urlObj.searchParams.set('utm_medium', utms.medium);
        if (utms.campaign) urlObj.searchParams.set('utm_campaign', utms.campaign);
      }

      // Update the target URL with these new params
      // Note: This preserves existing params like '?variant=123' automatically!
      targetUrl = urlObj.toString();
    } catch (e) {
      // If URL parsing fails (rare), we just use the original link
      console.error('Failed to append tracking params', e);
    }
    // ============================================================

    // --- PREVIEW CRAWLER (WhatsApp/Twitter/Facebook) ---
    if (this.isPreviewCrawler(req.headers['user-agent'])) {
      let title = link.product?.name;
      let description = link.product?.description;
      let imageUrl = link.product?.imageUrl;

      // Smart Variant Preview: If link is for specific variant, show THAT image
      try {
        const urlObj = new URL(targetUrl);
        const variantId = urlObj.searchParams.get('variant');

        if (variantId) {
          const specificVariant = await this.prisma.productVariant.findFirst({
            // Simple match. For production, matching by exact Landing URL is safer if variants stored fully.
            where: { landingUrl: { contains: `variant=${variantId}` } }
          });
          if (specificVariant) {
            title = `${link.product?.name} (${specificVariant.volume || specificVariant.sku})`;
            imageUrl = specificVariant.imageUrl || imageUrl;
          }
        }
      } catch (e) { }

      return res
        .status(200)
        .type('html')
        .send(
          this.renderPreviewPage(
            targetUrl,
            title,
            description,
            imageUrl
          )
        );
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

    // Final Redirect to Shopify (now including ?ref=... &utm_source=...)
    return res.redirect(targetUrl);
  }

  // ... (Keep all your existing private methods below unchanged: ensureCookie, getSessionId, etc.)

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

  private isPreviewCrawler(userAgent?: string | string[]) {
    if (!userAgent) return false;
    const ua = Array.isArray(userAgent) ? userAgent.join(' ') : userAgent;
    const crawlers = [
      'facebookexternalhit',
      'Facebot',
      'Twitterbot',
      'Slackbot',
      'WhatsApp',
      'LinkedInBot',
      'TelegramBot',
      'Discordbot'
    ];
    return crawlers.some((needle) => ua.toLowerCase().includes(needle.toLowerCase()));
  }

  private renderPreviewPage(
    targetUrl: string,
    title?: string | null,
    description?: string | null,
    imageUrl?: string | null
  ) {
    const safe = (value?: string | null, fallback = '') =>
      (value ?? fallback)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .trim();
    const resolvedTitle = safe(title, 'StarShield Product');
    const resolvedDescription = safe(description, 'Check out this product from StarShield.');
    const resolvedImage = imageUrl ? safe(imageUrl) : '';
    const resolvedUrl = safe(targetUrl);

    const cardType = resolvedImage ? 'summary_large_image' : 'summary';

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${resolvedTitle}</title>
    
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${resolvedUrl}" />
    <meta property="og:title" content="${resolvedTitle}" />
    <meta property="og:description" content="${resolvedDescription}" />
    ${resolvedImage ? `<meta property="og:image" content="${resolvedImage}" />` : ''}
    
    <meta name="twitter:card" content="${cardType}" />
    <meta name="twitter:url" content="${resolvedUrl}" />
    <meta name="twitter:title" content="${resolvedTitle}" />
    <meta name="twitter:description" content="${resolvedDescription}" />
    ${resolvedImage ? `<meta name="twitter:image" content="${resolvedImage}" />` : ''}
    
    <meta http-equiv="refresh" content="0;url='${resolvedUrl}'" />
  </head>
  <body>
    <p>Redirecting to <a href="${resolvedUrl}">${resolvedTitle}</a>...</p>
    <script>window.location.href = "${resolvedUrl}"</script>
  </body>
</html>`;
  }
}