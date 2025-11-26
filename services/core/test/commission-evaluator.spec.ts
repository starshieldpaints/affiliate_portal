import { PrismaService } from '../src/modules/prisma/prisma.service';
import { CommissionEvaluatorService } from '../src/modules/commission/services/commission-evaluator.service';
import { Prisma } from '@prisma/client';

describe('CommissionEvaluatorService', () => {
  const prisma = new PrismaService();
  const svc = new CommissionEvaluatorService(prisma);
  let affiliateId: string;
  let productId: string;
  let categoryId: string;
  let ruleId: string;
  let orderId: string;
  let orderItemId: string;

  beforeAll(async () => {
    const cat = await prisma.category.create({
      data: { name: 'Paints' }
    });
    categoryId = cat.id;
    const product = await prisma.product.create({
      data: {
        name: 'ProdA',
        price: new Prisma.Decimal(100),
        currency: 'USD',
        categoryId
      }
    });
    productId = product.id;
    const user = await prisma.user.create({
      data: {
        email: 'aff-eval@example.com',
        passwordHash: 'x',
        role: 'affiliate',
        status: 'active',
        affiliate: {
          create: {
            displayName: 'Eval Affiliate',
            defaultReferralCode: 'EVALAFF',
            panNumber: 'PAN12345',
            aadhaarNumber: 'AAD123456789'
          }
        }
      },
      include: { affiliate: true }
    });
    affiliateId = user.affiliate!.id;
    const order = await prisma.order.create({
      data: {
        externalOrderId: 'ORD-EVAL-1',
        placedAt: new Date(),
        totalGross: new Prisma.Decimal(100),
        totalNet: new Prisma.Decimal(100),
        currency: 'USD'
      }
    });
    orderId = order.id;
    const item = await prisma.orderItem.create({
      data: {
        orderId,
        productId,
        quantity: 1,
        unitPriceNet: new Prisma.Decimal(100),
        lineTotalNet: new Prisma.Decimal(100)
      }
    });
    orderItemId = item.id;
    const rule = await prisma.commissionRule.create({
      data: {
        name: '10 percent paint',
        type: 'percent',
        rate: new Prisma.Decimal('10'),
        excludeTaxShipping: true,
        isActive: true,
        scopes: {
          create: [{ productId }]
        }
      }
    });
    ruleId = rule.id;
  });

  afterAll(async () => {
    await prisma.commissionLedger.deleteMany({ where: { orderId } });
    await prisma.commissionRuleScope.deleteMany({ where: { commissionRuleId: ruleId } });
    await prisma.commissionRule.deleteMany({ where: { id: ruleId } });
    await prisma.orderItem.deleteMany({ where: { id: orderItemId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.affiliateProfile.deleteMany({ where: { id: affiliateId } });
    await prisma.user.deleteMany({ where: { email: 'aff-eval@example.com' } });
    await prisma.$disconnect();
  });

  it('creates pending ledger with effective rate for percent rule', async () => {
    await svc.evaluateOrder({
      orderId,
      affiliateId,
      currency: 'USD',
      placedAt: new Date(),
      items: [
        {
          id: orderItemId,
          lineTotalNet: new Prisma.Decimal(100),
          productId,
          categoryId
        }
      ]
    });

    const ledgers = await prisma.commissionLedger.findMany({ where: { orderId, affiliateId } });
    expect(ledgers.length).toBe(1);
    expect(Number(ledgers[0].amount)).toBeCloseTo(10);
    expect(ledgers[0].status).toBe('pending');
    expect(ledgers[0].effectiveRate).toBeTruthy();
    expect(ledgers[0].graceUntil).toBeTruthy();
  });

  it('sets grace window days', async () => {
    const placedAt = new Date();
    const graceDays = 3;
    await svc.evaluateOrder({
      orderId,
      affiliateId,
      currency: 'USD',
      placedAt,
      graceDays,
      items: [
        {
          id: orderItemId,
          lineTotalNet: new Prisma.Decimal(100),
          productId,
          categoryId
        }
      ]
    });
    const ledger = await prisma.commissionLedger.findFirst({ where: { orderId, affiliateId } });
    expect(ledger?.graceUntil).toBeTruthy();
    if (ledger?.graceUntil) {
      const diffDays = Math.round(
        (ledger.graceUntil.getTime() - placedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBeGreaterThanOrEqual(graceDays);
    }
  });
});
