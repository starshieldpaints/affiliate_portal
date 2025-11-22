import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuditService } from '../services/audit.service';

@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(
    @Query('actorEmail') actorEmail?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50'
  ) {
    return this.auditService.list({
      actorEmail,
      action,
      from,
      to,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  }

  @Get('export')
  export(
    @Res() res: Response,
    @Query('actorEmail') actorEmail?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const csv = this.auditService.exportCsv({ actorEmail, action, from, to });
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  }
}
