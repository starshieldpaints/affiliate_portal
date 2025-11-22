import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type OrderItemDto = { id: string; name: string | null; sku: string | null; price: number; quantity: number };
export type OrderDto = {
  id: string;
  orderNumber: string;
  affiliateId: string | null;
  productId: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded' | 'flagged';
  attribution: { ruleId: string | null; manualOverride: boolean };
  createdAt: Date;
  externalId?: string;
  paymentStatus?: string;
  risk?: 'high' | 'normal';
  items?: OrderItemDto[];
  couponCode?: string | null;
  storeId?: string | null;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(order: any): OrderDto {
    const firstAttr = order.attributions?.[0];
    return {
      id: order.id,
      orderNumber: order.externalOrderId,
      affiliateId: firstAttr?.affiliateId ?? null,
      productId: order.items?.[0]?.productId ?? null,
      amount: Number(order.totalGross ?? 0),
      currency: order.currency,
      status: (order.paymentStatus as any) ?? 'paid',
      attribution: { ruleId: firstAttr?.ruleId ?? null, manualOverride: false },
      createdAt: order.placedAt,
      externalId: order.externalOrderId,
      paymentStatus: order.paymentStatus,
      risk: 'normal',
      items:
        order.items?.map((i: any) => ({
          id: i.id,
          name: i.product?.name ?? null,
          sku: i.product?.sku ?? null,
          price: Number(i.lineTotalNet ?? i.unitPriceNet ?? 0),
          quantity: i.quantity
        })) ?? [],
      couponCode: order.couponCode,
      storeId: order.storeId
    };
  }

  async list(params: { search?: string; status?: string; risk?: string; page?: number; pageSize?: number }) {
    const { search, status, page = 1, pageSize = 20 } = params;
    const where: any = {};
    if (search) {
      where.OR = [
        { externalOrderId: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status && status !== 'all') {
      where.paymentStatus = status;
    }
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (page - 1) * take;
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true } },
          attributions: true
        },
        orderBy: { placedAt: 'desc' },
        take,
        skip
      }),
      this.prisma.order.count({ where })
    ]);
    return { data: orders.map((o) => this.toDto(o)), meta: { page, pageSize: take, total } };
  }

  async getById(id: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        attributions: true
      }
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.toDto(order);
  }

  async update(id: string, partial: Partial<OrderDto>) {
    const data: any = {};
    if (partial.status) data.paymentStatus = partial.status;
    // Attribution/rule override would require schema changes; skipped here.
    const updated = await this.prisma.order.update({
      where: { id },
      data,
      include: { items: { include: { product: true } }, attributions: true }
    });
    return this.toDto(updated);
  }

  async refund(id: string, amount: number, reason: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    await this.prisma.order.update({
      where: { id },
      data: { paymentStatus: 'refunded' }
    });
    const firstItem = order.items[0];
    await this.prisma.refundEvent.create({
      data: {
        orderId: id,
        orderItemId: firstItem?.id ?? order.items[0]?.id,
        amount,
        reason
      }
    });
    return { id: `refund_${Date.now()}`, status: 'submitted' };
  }
}
