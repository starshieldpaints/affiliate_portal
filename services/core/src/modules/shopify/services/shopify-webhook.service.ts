import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommissionStatus,
  PaymentStatus,
  Prisma
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionEvaluatorService } from '../../commission/services/commission-evaluator.service';

type ShopifyOrderPayload = {
  id?: number | string;
  created_at?: string;
  processed_at?: string;
  currency?: string;
  financial_status?: string;
  total_price?: string | null;
  subtotal_price?: string | null;
  customer?: { id?: number | string } | null;
  email?: string | null;
  discount_codes?: Array<{ code?: string | null }> | null;
  location_id?: number | string | null;
  line_items?: ShopifyLineItem[];
};

type ShopifyLineItem = {
  id?: number | string;
  product_id?: number | string | null;
  sku?: string | null;
  title?: string | null;
  quantity?: number;
  price?: string | null;
  total_discount?: string | null;
  total?: string | null;
};

type ShopifyRefundPayload = {
  id?: number | string;
  order_id?: number | string;
  note?: string | null;
  refund_line_items?: Array<{
    line_item_id?: number | string;
    subtotal?: string | null;
    quantity?: number;
  }>;
};

@Injectable()
export class ShopifyWebhookService {
  private readonly logger = new Logger(ShopifyWebhookService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
    private readonly commissionEvaluator: CommissionEvaluatorService
  ) {
    this.webhookSecret = configService.get<string>('shopify.webhookSecret', '');
  }

  verifySignature(signature: string | undefined, rawBody?: Buffer) {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException('Shopify webhook secret not configured');
    }
    if (!signature) {
      throw new UnauthorizedException('Missing Shopify signature');
    }
    if (!rawBody) {
      throw new BadRequestException('Webhook payload missing raw body');
    }

    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('base64');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid Shopify signature');
    }
  }

  async handleWebhook(
    topic: string | undefined,
    payload: Record<string, any>,
    shopDomain?: string
  ) {
    if (!topic) {
      throw new BadRequestException('Missing Shopify topic');
    }

    if (topic.startsWith('orders/')) {
      await this.handleOrderPayload(payload as ShopifyOrderPayload, topic, shopDomain);
      return;
    }

    if (topic === 'refunds/create') {
      await this.handleRefundPayload(payload as ShopifyRefundPayload);
      return;
    }

    this.logger.debug(`Unhandled Shopify topic: ${topic}`);
  }

  private async handleOrderPayload(
    payload: ShopifyOrderPayload,
    topic: string,
    shopDomain?: string
  ) {
    if (!payload?.id) {
      this.logger.warn(`Skipping Shopify order webhook without id for topic ${topic}`);
      return;
    }

    const paymentStatus = this.mapFinancialStatus(payload.financial_status);
    const externalOrderId = String(payload.id);
    const placedAt = payload.created_at ?? payload.processed_at ?? new Date().toISOString();

    const orderData = {
      externalOrderId,
      placedAt: new Date(placedAt),
      totalGross: this.toDecimal(payload.total_price),
      totalNet: this.toDecimal(payload.subtotal_price),
      currency: payload.currency ?? 'USD',
      paymentStatus,
      customerHash: payload.customer?.id?.toString() ?? payload.email ?? null,
      storeId: shopDomain ?? payload.location_id?.toString() ?? null,
      couponCode: payload.discount_codes?.[0]?.code ?? null
    };

    const order = await this.prisma.order.upsert({
      where: { externalOrderId },
      create: orderData,
      update: orderData
    });

    await this.syncLineItems(order.id, payload.line_items ?? [], order.currency);
    // Evaluate commissions (affiliate attribution not yet resolved here; evaluator skips if none)
    const items = await this.prisma.orderItem.findMany({
      where: { orderId: order.id },
      select: {
        id: true,
        lineTotalNet: true,
        productId: true,
        product: { select: { categoryId: true } }
      }
    });
    await this.commissionEvaluator.evaluateOrder({
      orderId: order.id,
      affiliateId: null, // TODO: inject resolved affiliate attribution when available
      currency: order.currency,
      placedAt: order.placedAt,
      paymentStatus,
      items: items.map((i) => ({
        id: i.id,
        lineTotalNet: i.lineTotalNet,
        productId: i.productId,
        categoryId: i.product?.categoryId ?? null
      }))
    });
    await this.syncLedgerStatus(order.id, paymentStatus);
  }

  private async handleRefundPayload(payload: ShopifyRefundPayload) {
    if (!payload?.order_id) {
      this.logger.warn('Refund webhook missing order_id');
      return;
    }

    const externalOrderId = String(payload.order_id);
    const order = await this.prisma.order.findUnique({
      where: { externalOrderId },
      select: { id: true }
    });

    if (!order) {
      this.logger.warn(`Refund webhook for unknown order ${externalOrderId}`);
      return;
    }

    const refundLines = payload.refund_line_items ?? [];
    if (refundLines.length === 0) {
      this.logger.debug('Refund webhook without refund_line_items');
      return;
    }

    const lineItemIds = refundLines
      .map((line) => line.line_item_id)
      .filter((id): id is number | string => Boolean(id))
      .map((id) => String(id));

    const orderItems = await this.prisma.orderItem.findMany({
      where: { externalLineItemId: { in: lineItemIds } },
      select: { id: true, externalLineItemId: true }
    });

    const itemLookup = new Map(orderItems.map((item) => [item.externalLineItemId, item.id]));

    const refundEvents = refundLines.reduce<
      Array<{ orderId: string; orderItemId: string; amount: Prisma.Decimal; reason?: string }>
    >((acc, line) => {
      const key = line.line_item_id ? String(line.line_item_id) : undefined;
      const orderItemId = key ? itemLookup.get(key) : undefined;
      if (!orderItemId) {
        return acc;
      }

      const amount = this.toDecimal(line.subtotal) ?? new Prisma.Decimal(0);
      acc.push({
        orderId: order.id,
        orderItemId,
        amount,
        reason: payload.note ?? undefined
      });
      return acc;
    }, []);

    if (refundEvents.length > 0) {
      await this.prisma.refundEvent.createMany({
        data: refundEvents,
        skipDuplicates: true
      });
    }

    await this.syncLedgerStatus(order.id, PaymentStatus.refunded, 'Refund recorded via Shopify');
  }

  private async syncLineItems(
    orderId: string,
    lineItems: ShopifyLineItem[],
    currency: string
  ) {
    if (lineItems.length === 0) {
      await this.prisma.orderItem.deleteMany({ where: { orderId } });
      return;
    }

    const productIds = Array.from(
      new Set(
        lineItems
          .map((line) => line.product_id)
          .filter((id): id is number | string => Boolean(id))
          .map((id) => String(id))
      )
    );

    const products =
      productIds.length > 0
        ? await this.prisma.product.findMany({
            where: { externalProductId: { in: productIds } },
            select: { id: true, externalProductId: true }
          })
        : [];

    const productLookup = new Map(products.map((product) => [product.externalProductId, product.id]));

    const data = lineItems.map((line) => {
      const productId = line.product_id ? productLookup.get(String(line.product_id)) : undefined;
      const quantity = line.quantity && line.quantity > 0 ? line.quantity : 1;
      const unitPrice = this.toDecimal(line.price) ?? new Prisma.Decimal(0);
      const discount = this.toDecimal(line.total_discount);
      const computedTotal = unitPrice
        .mul(quantity)
        .sub(discount ?? new Prisma.Decimal(0));
      const lineTotal = this.toDecimal(line.total) ?? computedTotal;

      return {
        orderId,
        productId: productId ?? null,
        externalLineItemId: line.id ? String(line.id) : null,
        quantity,
        unitPriceNet: unitPrice,
        discountAmount: discount,
        lineTotalNet: lineTotal
      };
    });

    await this.prisma.$transaction([
      this.prisma.orderItem.deleteMany({ where: { orderId } }),
      this.prisma.orderItem.createMany({ data, skipDuplicates: true })
    ]);

    this.logger.debug(`Synced ${data.length} line items for order ${orderId} (${currency})`);
  }

  private async syncLedgerStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    reason?: string
  ) {
    if (paymentStatus === PaymentStatus.paid) {
      await this.prisma.commissionLedger.updateMany({
        where: { orderId, status: CommissionStatus.pending },
        data: { status: CommissionStatus.approved, reason: reason ?? 'Order paid in Shopify' }
      });
      return;
    }

    if (paymentStatus === PaymentStatus.refunded || paymentStatus === PaymentStatus.canceled) {
      await this.prisma.commissionLedger.updateMany({
        where: {
          orderId,
          status: {
            in: [CommissionStatus.pending, CommissionStatus.approved]
          }
        },
        data: {
          status: CommissionStatus.reversed,
          reason: reason ?? 'Order refunded or canceled in Shopify'
        }
      });
    }
  }

  private mapFinancialStatus(status?: string | null): PaymentStatus {
    switch ((status ?? '').toLowerCase()) {
      case 'paid':
      case 'partially_paid':
        return PaymentStatus.paid;
      case 'pending':
      case 'authorized':
        return PaymentStatus.pending;
      case 'refunded':
      case 'voided':
      case 'partially_refunded':
        return PaymentStatus.refunded;
      case 'canceled':
        return PaymentStatus.canceled;
      default:
        return PaymentStatus.pending;
    }
  }

  private toDecimal(value?: string | number | null): Prisma.Decimal | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const asString = typeof value === 'number' ? value.toFixed(2) : value;
    try {
      return new Prisma.Decimal(asString);
    } catch (error) {
      this.logger.warn(`Failed to convert value "${value}" to decimal`);
      return null;
    }
  }
}
