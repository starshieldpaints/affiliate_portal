import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TrackingController],
  providers: [TrackingService]
})
export class TrackingModule {}
