import { Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { CommissionRulesService } from '../services/commission-rules.service';
import { CreateCommissionRuleDto } from '../dto/commission-rule.dto';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: UserRole;
  };
};

@Controller('admin/commission-rules')
export class CommissionRulesController {
  constructor(private readonly commissionRulesService: CommissionRulesService) {}

  @Get()
  list(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: 'all' | 'active' | 'scheduled' | 'expired' | 'inactive',
    @Query('search') search?: string
  ) {
    this.ensureAdmin(req);
    return this.commissionRulesService.list({ status, search });
  }

  @Get(':id')
  getById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.commissionRulesService.getById(id);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() body: CreateCommissionRuleDto) {
    this.ensureAdmin(req);
    return this.commissionRulesService.createRule(body);
  }

  private ensureAdmin(req: AuthenticatedRequest) {
    if (!req.user || req.user.role !== UserRole.admin) {
      throw new UnauthorizedException('Admin access only');
    }
  }
}
