import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionEvaluatorService } from './services/commission-evaluator.service';

@Module({
  imports: [PrismaModule],
  providers: [CommissionEvaluatorService],
  exports: [CommissionEvaluatorService]
})
export class CommissionModule {}
