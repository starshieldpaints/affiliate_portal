import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';

@Controller('admin/reports')
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
}
