import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PayoutsService } from '../services/payouts.service';
import { CreatePayoutBatchDto, ReconcileBatchDto } from '../dto/payouts.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';

@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  listLines(
    @Query('status') status = 'all',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    return this.payoutsService.listLines({ status, page: Number(page), pageSize: Number(pageSize) });
  }

  @Get('batches')
  listBatches(
    @Query('status') status = 'all',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20'
  ) {
    return this.payoutsService.listBatches({
      status,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  }

  @Post('batch')
  createBatch(@Body() body: CreatePayoutBatchDto) {
    return this.payoutsService.createBatch(body.affiliateIds, body.scheduledFor);
  }

  @Post('batch/:id/process')
  processBatch(@Param('id') id: string) {
    return this.payoutsService.processBatch(id);
  }

  @Patch('batch/:id/reconcile')
  reconcile(@Param('id') id: string, @Body() body: ReconcileBatchDto) {
    return this.payoutsService.reconcileBatch(id, body.receiptUrl);
  }
}
