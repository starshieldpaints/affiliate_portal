import { Injectable } from '@nestjs/common';
import { CommissionStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type EvaluateOrderInput = {
  orderId: string;
  affiliateId?: string | null;
  currency: string;
  placedAt: Date;
  items: Array<{
    id: string;
    lineTotalNet: Prisma.Decimal | null;
    productId?: string | null;
    categoryId?: string | null;
  }>;
  overrideRuleId?: string | null;
  paymentStatus?: PaymentStatus;
  graceDays?: number;
};

@Injectable()
export class CommissionEvaluatorService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateOrder(input: EvaluateOrderInput) {
    if (!input.affiliateId) {
      return [];
    }
    if (input.paymentStatus && input.paymentStatus !== PaymentStatus.paid) {
      return [];
    }

    const graceDays = input.graceDays ?? 7;
    const graceUntil = new Date(input.placedAt);
    graceUntil.setDate(graceUntil.getDate() + graceDays);

    const rules = await this.loadRules(input.overrideRuleId);
    const ledgerCreates: Prisma.CommissionLedgerCreateManyInput[] = [];

    for (const item of input.items) {
      const base = item.lineTotalNet ?? new Prisma.Decimal(0);
      if (base.lte(0)) continue;
      const rule = this.pickRule(rules, item.productId, item.categoryId, input.affiliateId);
      if (!rule) continue;
      const rateDec = new Prisma.Decimal(rule.rate);
      const amount =
        rule.type === 'percent'
          ? base.mul(rateDec).div(new Prisma.Decimal(100))
          : new Prisma.Decimal(rule.rate);

      ledgerCreates.push({
        affiliateId: input.affiliateId,
        orderId: input.orderId,
        orderItemId: item.id,
        ruleId: rule.id,
        amount,
        currency: input.currency,
        status: CommissionStatus.pending,
        effectiveRate: rule.type === 'percent' ? rateDec.div(new Prisma.Decimal(100)) : rateDec,
        graceUntil,
        reason: 'Auto-generated via commission evaluator'
      });
    }

    if (ledgerCreates.length === 0) {
      return [];
    }

    await this.prisma.commissionLedger.deleteMany({
      where: { orderId: input.orderId, affiliateId: input.affiliateId }
    });
    const created = await this.prisma.commissionLedger.createMany({
      data: ledgerCreates
    });
    return created;
  }

  private async loadRules(overrideRuleId?: string | null) {
    if (overrideRuleId) {
      const rule = await this.prisma.commissionRule.findUnique({
        where: { id: overrideRuleId },
        include: {
          scopes: true
        }
      });
      return rule ? [rule] : [];
    }
    return this.prisma.commissionRule.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }]
      },
      include: { scopes: true },
      orderBy: [{ startsAt: 'desc' }]
    });
  }

  private pickRule(
    rules: Array<{
      id: string;
      type: string;
      rate: Prisma.Decimal;
      excludeTaxShipping: boolean;
      startsAt: Date | null;
      endsAt: Date | null;
      scopes: Array<{ productId: string | null; categoryId: string | null; affiliateId: string | null }>;
    }>,
    productId?: string | null,
    categoryId?: string | null,
    affiliateId?: string | null
  ) {
    const now = new Date();
    return rules.find((rule) => {
      if (rule.startsAt && rule.startsAt > now) return false;
      if (rule.endsAt && rule.endsAt < now) return false;
      if (!rule.scopes.length) return true;
      return rule.scopes.some((s) => {
        const productMatch = s.productId ? s.productId === productId : true;
        const categoryMatch = s.categoryId ? s.categoryId === categoryId : true;
        const affiliateMatch = s.affiliateId ? s.affiliateId === affiliateId : true;
        return productMatch && categoryMatch && affiliateMatch;
      });
    });
  }
}
