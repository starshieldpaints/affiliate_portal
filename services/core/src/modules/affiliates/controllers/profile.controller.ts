import { Body, Controller, Get, Patch, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AffiliatesService } from '../services/affiliates.service';
import { UpdateAffiliateProfileDto } from '../dto/update-affiliate-profile.dto';
import { CreateAffiliateLinkDto } from '../dto/create-affiliate-link.dto';
import { RequestUploadUrlDto } from '../dto/request-upload-url.dto';
import { RequestDownloadUrlDto } from '../dto/request-download-url.dto';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
  };
};

@Controller('affiliates')
export class AffiliateProfileController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Get('dashboard')
  async dashboard(@Req() req: AuthenticatedRequest) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    return this.affiliatesService.getDashboardOverview(req.user.userId);
  }

  @Get('notifications')
  async notifications(@Req() req: AuthenticatedRequest) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    return this.affiliatesService.getNotifications(req.user.userId);
  }

  @Get('payouts')
  async payouts(@Req() req: AuthenticatedRequest) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    return this.affiliatesService.getPayoutOverview(req.user.userId);
  }

  @Get('reports')
  async reports(@Req() req: AuthenticatedRequest) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    return this.affiliatesService.getReportsSnapshot(req.user.userId);
  }

  @Patch('me')
  updateOwnProfile(@Req() req: AuthenticatedRequest, @Body() body: UpdateAffiliateProfileDto) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    return this.affiliatesService.updateProfile(req.user.userId, body);
  }

  @Post('links')
  createLink(@Req() req: AuthenticatedRequest, @Body() body: CreateAffiliateLinkDto) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    return this.affiliatesService.createAffiliateLink(req.user.userId, body);
  }

  @Post('uploads/sign')
  requestUploadUrl(@Req() req: AuthenticatedRequest, @Body() body: RequestUploadUrlDto) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    return this.affiliatesService.requestDocumentUpload(req.user.userId, body);
  }

  @Post('uploads/access')
  requestDownloadUrl(@Req() req: AuthenticatedRequest, @Body() body: RequestDownloadUrlDto) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    return this.affiliatesService.requestDocumentAccess(req.user.userId, body);
  }
}
