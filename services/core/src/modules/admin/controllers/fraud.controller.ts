import { Controller, Get, Param, Patch, Body, Query } from '@nestjs/common';
import { FraudService } from '../services/fraud.service';

@Controller('admin/fraud/alerts')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    return this.fraudService.list({ status, type, page: Number(page), pageSize: Number(pageSize) });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.fraudService.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { status: 'open' | 'closed'; note?: string }) {
    return this.fraudService.update(id, body.status, body.note);
  }
}
