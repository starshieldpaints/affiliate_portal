import { Controller, Get, ForbiddenException, NotFoundException, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AdminService } from '../services/admin.service';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: UserRole;
  };
};

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    if (!req.user || req.user.role !== UserRole.admin) {
      throw new ForbiddenException('Admin access only');
    }

    await this.adminService.requirePermission(req.user.userId, 'admin:profile:read');
    const profile = await this.adminService.getProfile(req.user.userId);
    if (!profile) {
      throw new NotFoundException('Admin profile not found');
    }
    return profile;
  }
}
