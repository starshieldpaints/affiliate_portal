import { Body, Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { CommissionRulesService } from '../services/commission-rules.service';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto } from '../dto/commission-rule.dto';

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
    @Query('status') status?: 'all' | 'active' | 'inactive',
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    this.ensureAdmin(req);
    return this.commissionRulesService.list({
      status,
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20
    });
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

  @Patch(':id')
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateCommissionRuleDto) {
    this.ensureAdmin(req);
    return this.commissionRulesService.updateRule(id, body);
  }

  @Post(':id/activate')
  activate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.commissionRulesService.setActive(id, true);
  }

  @Post(':id/deactivate')
  deactivate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.ensureAdmin(req);
    return this.commissionRulesService.setActive(id, false);
  }

  private ensureAdmin(req: AuthenticatedRequest) {
    if (!req.user || req.user.role !== UserRole.admin) {
      throw new UnauthorizedException('Admin access only');
    }
  }
}
