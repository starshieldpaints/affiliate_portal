import { Body, Controller, Patch, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AffiliatesService } from '../services/affiliates.service';
import { UpdateAffiliateProfileDto } from '../dto/update-affiliate-profile.dto';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
  };
};

@Controller('affiliates')
export class AffiliateProfileController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Patch('me')
  updateOwnProfile(@Req() req: AuthenticatedRequest, @Body() body: UpdateAffiliateProfileDto) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    return this.affiliatesService.updateProfile(req.user.userId, body);
  }
}
