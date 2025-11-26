import { Controller, Get, Post, Query, Body, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  list(@Query('type') type?: string, @Query('range') range?: string) {
    return this.reportsService.list(type, range);
  }

  @Post()
  create(@Body() body: { type: string; range: string; format: string }) {
    return this.reportsService.create(body.type, body.range, body.format);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    return this.reportsService.streamReport(id, res);
  }
}
