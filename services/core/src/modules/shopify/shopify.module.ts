import { Module } from '@nestjs/common';
import { ShopifyWebhookController } from './controllers/shopify-webhook.controller';
import { ShopifyWebhookService } from './services/shopify-webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CommissionModule } from '../commission/commission.module';

@Module({
  imports: [PrismaModule, ConfigModule, CommissionModule],
  controllers: [ShopifyWebhookController],
  providers: [ShopifyWebhookService]
})
export class ShopifyModule {}
