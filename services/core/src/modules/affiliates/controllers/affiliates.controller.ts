import { Controller, Get, Param, Query, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AffiliatesService } from '../services/affiliates.service';

@Controller('admin/affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('take') take?: string
  ) {
    this.ensureAdmin(req);
    const parsedTake = take ? Number.parseInt(take, 10) : undefined;
    return this.affiliatesService.findAll({
      search,
      status,
      kycStatus,
      take: Number.isNaN(parsedTake ?? NaN) ? undefined : parsedTake
    });
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.affiliatesService.findOne(id);
  }

  private ensureAdmin(req: Request) {
    const authUser = req.user as { userId: string; role: UserRole } | undefined;
    if (!authUser || authUser.role !== UserRole.admin) {
      throw new UnauthorizedException('Admin access only');
    }
    return authUser;
  }
}
