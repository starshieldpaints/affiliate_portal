import { Module } from '@nestjs/common';
import { PayoutsController } from './controllers/payouts.controller';
import { PayoutsService } from './services/payouts.service';

@Module({
  controllers: [PayoutsController],
  providers: [PayoutsService]
})
export class PayoutsModule {}
