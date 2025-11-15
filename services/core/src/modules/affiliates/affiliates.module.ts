import { Module } from '@nestjs/common';
import { AffiliatesController } from './controllers/affiliates.controller';
import { AffiliateProfileController } from './controllers/profile.controller';
import { AffiliatesService } from './services/affiliates.service';

@Module({
  controllers: [AffiliatesController, AffiliateProfileController],
  providers: [AffiliatesService]
})
export class AffiliatesModule {}
