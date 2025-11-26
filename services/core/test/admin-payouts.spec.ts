import { Prisma, CommissionStatus, PayoutBatchStatus, PayoutLineStatus } from '@prisma/client';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { PayoutsService } from '../src/modules/admin/services/payouts.service';
import { StubPayoutProvider } from '../src/modules/payouts/providers/stub-payout.provider';

describe('Admin PayoutsService', () => {
  const prisma = new PrismaService();
  const provider = new StubPayoutProvider();
  const svc = new PayoutsService(prisma, provider as any);
  let affiliateId: string;
  let ledgerId: string;
  let batchId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `payout-${Date.now()}@example.com`,
        passwordHash: 'x',
        role: 'affiliate',
        status: 'active',
        affiliate: {
          create: {
            displayName: 'Payout Affiliate',
            defaultReferralCode: `PAY${Date.now()}`,
            panNumber: 'ABCDE1234F',
            aadhaarNumber: '999988887777'
          }
        }
      },
      include: { affiliate: true }
    });
    affiliateId = user.affiliate!.id;
    const order = await prisma.order.create({
      data: {
        externalOrderId: `PO-${Date.now()}`,
        placedAt: new Date(),
        totalGross: new Prisma.Decimal(100),
        totalNet: new Prisma.Decimal(100),
        currency: 'USD'
      }
    });
    const item = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        quantity: 1,
        unitPriceNet: new Prisma.Decimal(100),
        lineTotalNet: new Prisma.Decimal(100)
      }
    });
    const ledger = await prisma.commissionLedger.create({
      data: {
        affiliateId,
        orderId: order.id,
        orderItemId: item.id,
        amount: new Prisma.Decimal(25),
        currency: 'USD',
        status: CommissionStatus.approved
      }
    });
    ledgerId = ledger.id;
  });

  afterAll(async () => {
    await prisma.payoutLine.deleteMany({ where: { affiliateId } });
    await prisma.payoutBatch.deleteMany({});
    await prisma.commissionLedger.deleteMany({ where: { affiliateId } });
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.affiliateProfile.deleteMany({ where: { id: affiliateId } });
    await prisma.user.deleteMany({ where: { affiliate: { id: affiliateId } } });
    await prisma.$disconnect();
  });

  it('aggregates approved ledger entries into a payout batch and locks them', async () => {
    const result = await svc.createBatch([affiliateId], new Date().toISOString());
    expect(result.ok).toBe(true);
    expect(result.data?.lineCount).toBe(1);
    batchId = result.data?.batchId as string;

    const ledger = await prisma.commissionLedger.findUnique({ where: { id: ledgerId } });
    expect(ledger?.payoutLineId).toBeTruthy();
    expect(ledger?.lockedAt).toBeTruthy();

    const line = await prisma.payoutLine.findFirst({ where: { batchId } });
    expect(line?.amount).toEqual(new Prisma.Decimal(25));
  });

  it('processes batch through stub provider and marks paid', async () => {
    const processed = await svc.processBatch(batchId);
    expect(processed.data?.status).toBe(PayoutBatchStatus.paid);

    const batch = await prisma.payoutBatch.findUnique({ where: { id: batchId } });
    expect(batch?.status).toBe(PayoutBatchStatus.paid);
    const line = await prisma.payoutLine.findFirst({ where: { batchId } });
    expect(line?.status).toBe(PayoutLineStatus.paid);
  });

  it('stub provider can simulate failure', async () => {
    // create another ledger to batch
    const order = await prisma.order.create({
      data: {
        externalOrderId: `PO-F-${Date.now()}`,
        placedAt: new Date(),
        totalGross: new Prisma.Decimal(50),
        totalNet: new Prisma.Decimal(50),
        currency: 'USD'
      }
    });
    const item = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        quantity: 1,
        unitPriceNet: new Prisma.Decimal(50),
        lineTotalNet: new Prisma.Decimal(50)
      }
    });
    await prisma.commissionLedger.create({
      data: {
        affiliateId,
        orderId: order.id,
        orderItemId: item.id,
        amount: new Prisma.Decimal(10),
        currency: 'USD',
        status: CommissionStatus.approved
      }
    });

    const failingSvc = new PayoutsService(prisma, new StubPayoutProvider({ shouldFail: true }) as any);
    const createRes = await failingSvc.createBatch([affiliateId], new Date().toISOString());
    const newBatchId = createRes.data?.batchId as string;
    const processed = await failingSvc.processBatch(newBatchId);
    expect(processed.data?.status).toBe(PayoutBatchStatus.failed);
    const batch = await prisma.payoutBatch.findUnique({ where: { id: newBatchId } });
    expect(batch?.status).toBe(PayoutBatchStatus.failed);
  });
});
