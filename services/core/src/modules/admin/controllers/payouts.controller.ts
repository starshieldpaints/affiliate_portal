import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { PayoutsService } from '../services/payouts.service';

@Controller('admin/payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  list(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    return this.payoutsService.list(status, Number(page), Number(pageSize));
  }

  @Get('batches')
  batches(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    return this.payoutsService.getBatches(status, Number(page), Number(pageSize));
  }

  @Post('batch')
  createBatch(@Body() body: { affiliateIds: string[]; scheduledFor: string }) {
    return this.payoutsService.createBatch(body.affiliateIds ?? [], body.scheduledFor);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { status: 'paid' | 'failed'; notes?: string }) {
    return this.payoutsService.updateStatus(id, body.status, body.notes);
  }
}
