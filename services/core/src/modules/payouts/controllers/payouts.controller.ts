import { Controller, Get } from '@nestjs/common';
import { PayoutsService } from '../services/payouts.service';

@Controller('admin/payout-batches')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  findAll() {
    return this.payoutsService.findAll();
  }
}
