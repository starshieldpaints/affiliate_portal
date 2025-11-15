import { Module } from '@nestjs/common';
import { ShopifyWebhookController } from './controllers/shopify-webhook.controller';
import { ShopifyWebhookService } from './services/shopify-webhook.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShopifyWebhookController],
  providers: [ShopifyWebhookService]
})
export class ShopifyModule {}
