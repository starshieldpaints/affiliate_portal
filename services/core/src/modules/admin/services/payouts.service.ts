import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommissionStatus, PayoutBatchStatus, PayoutLineStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PAYOUT_PROVIDER,
  PayoutProviderAdapter
} from '../../payouts/providers/payout-provider.interface';

type ListParams = { status?: string; page: number; pageSize: number };

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYOUT_PROVIDER) private readonly provider: PayoutProviderAdapter
  ) {}

  async listLines(params: ListParams) {
    const where: Prisma.PayoutLineWhereInput = {};
    if (params.status && params.status !== 'all') where.status = params.status as PayoutLineStatus;
    const take = Math.min(Math.max(params.pageSize, 1), 100);
    const skip = (params.page - 1) * take;
    const [lines, total] = await this.prisma.$transaction([
      this.prisma.payoutLine.findMany({
        where,
        include: { affiliate: true, batch: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      this.prisma.payoutLine.count({ where })
    ]);

    return {
      meta: { page: params.page, pageSize: take, total, totalPages: Math.ceil(total / take) || 1 },
      data: lines.map((l) => ({
        id: l.id,
        batchId: l.batchId,
        affiliateId: l.affiliateId,
        amount: Number(l.amount),
        currency: l.currency,
        status: l.status,
        createdAt: l.createdAt
      }))
    };
  }

  async listBatches(params: ListParams) {
    const where: Prisma.PayoutBatchWhereInput = {};
    if (params.status && params.status !== 'all') where.status = params.status as PayoutBatchStatus;
    const take = Math.min(Math.max(params.pageSize, 1), 100);
    const skip = (params.page - 1) * take;
    const [batches, total] = await this.prisma.$transaction([
      this.prisma.payoutBatch.findMany({
        where,
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      this.prisma.payoutBatch.count({ where })
    ]);

    return {
      meta: { page: params.page, pageSize: take, total, totalPages: Math.ceil(total / take) || 1 },
      data: batches.map((b) => ({
        id: b.id,
        status: b.status,
        provider: b.provider,
        providerBatchId: b.providerBatchId,
        totalAmount: b.totalAmount ? Number(b.totalAmount) : 0,
        currency: b.currency,
        lineCount: b.lines.length,
        createdAt: b.createdAt,
        reconciledAt: b.reconciledAt
      }))
    };
  }

  async createBatch(affiliateIds?: string[], scheduledFor?: string) {
    const where: Prisma.CommissionLedgerWhereInput = {
      status: CommissionStatus.approved,
      payoutLineId: null,
      lockedAt: null
    };
    if (affiliateIds && affiliateIds.length) {
      where.affiliateId = { in: affiliateIds };
    }

    const ledgers = await this.prisma.commissionLedger.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });
    if (!ledgers.length) {
      return { ok: true, data: null, message: 'No eligible ledger entries' };
    }

    const grouped = ledgers.reduce<Record<string, Prisma.CommissionLedgerUncheckedCreateInput[]>>(
      (acc, l) => {
        if (!acc[l.affiliateId]) acc[l.affiliateId] = [];
        acc[l.affiliateId].push(l);
        return acc;
      },
      {}
    );

    const scheduledDate = scheduledFor ? new Date(scheduledFor) : new Date();
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const batch = await tx.payoutBatch.create({
        data: {
          periodStart: now,
          periodEnd: scheduledDate,
          status: PayoutBatchStatus.processing,
          provider: 'stub'
        }
      });

      let total = new Prisma.Decimal(0);
      for (const [affiliateId, entries] of Object.entries(grouped)) {
        const lineAmount = entries.reduce(
          (sum, l) => sum.add(l.amount as unknown as Prisma.Decimal),
          new Prisma.Decimal(0)
        );
        total = total.add(lineAmount);
        const line = await tx.payoutLine.create({
          data: {
            batchId: batch.id,
            affiliateId,
            amount: lineAmount,
            currency: entries[0].currency,
            status: PayoutLineStatus.queued
          }
        });
        await tx.commissionLedger.updateMany({
          where: { id: { in: entries.map((e) => e.id!).filter(Boolean) as string[] } },
          data: { payoutLineId: line.id, lockedAt: now }
        });
      }

      await tx.payoutBatch.update({
        where: { id: batch.id },
        data: { totalAmount: total }
      });

      return tx.payoutBatch.findUnique({
        where: { id: batch.id },
        include: { lines: true }
      });
    });

    return {
      ok: true,
      data: {
        batchId: result?.id,
        lineCount: result?.lines.length ?? 0,
        totalAmount: result?.totalAmount ? Number(result.totalAmount) : 0
      }
    };
  }

  async processBatch(batchId: string) {
    const batch = await this.prisma.payoutBatch.findUnique({
      where: { id: batchId },
      include: { lines: true }
    });
    if (!batch) throw new NotFoundException('Batch not found');

    const providerResult = await this.provider.submitBatch(batch, batch.lines);
    const status =
      providerResult.status === 'paid' ? PayoutBatchStatus.paid : PayoutBatchStatus.failed;

    await this.prisma.$transaction([
      this.prisma.payoutBatch.update({
        where: { id: batchId },
        data: {
          status,
          providerBatchId: providerResult.providerBatchId ?? batch.providerBatchId,
          receiptUrl: providerResult.receiptUrl ?? batch.receiptUrl
        }
      }),
      this.prisma.payoutLine.updateMany({
        where: { batchId },
        data: { status: status === PayoutBatchStatus.paid ? PayoutLineStatus.paid : PayoutLineStatus.failed }
      })
    ]);

    return {
      ok: true,
      data: {
        batchId,
        status,
        providerBatchId: providerResult.providerBatchId,
        receiptUrl: providerResult.receiptUrl
      }
    };
  }

  async reconcileBatch(batchId: string, receiptUrl?: string) {
    const batch = await this.prisma.payoutBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Batch not found');
    const updated = await this.prisma.payoutBatch.update({
      where: { id: batchId },
      data: { reconciledAt: new Date(), receiptUrl: receiptUrl ?? batch.receiptUrl }
    });
    return { ok: true, data: { batchId: updated.id, reconciledAt: updated.reconciledAt } };
  }
}
