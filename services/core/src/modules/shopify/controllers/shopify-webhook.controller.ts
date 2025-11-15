import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req
} from '@nestjs/common';
import type { Request } from 'express';
import { ShopifyWebhookService } from '../services/shopify-webhook.service';

@Controller('webhooks/shopify')
export class ShopifyWebhookController {
  constructor(private readonly shopifyWebhookService: ShopifyWebhookService) {}

  @Post('orders')
  @HttpCode(HttpStatus.OK)
  async handleOrdersWebhook(
    @Headers('x-shopify-hmac-sha256') signature: string | undefined,
    @Headers('x-shopify-topic') topic: string | undefined,
    @Headers('x-shopify-shop-domain') shopDomain: string | undefined,
    @Req() req: Request,
    @Body() payload: Record<string, any>
  ) {
    this.shopifyWebhookService.verifySignature(signature, req.rawBody);
    await this.shopifyWebhookService.handleWebhook(topic, payload, shopDomain);
    return { ok: true };
  }
}
