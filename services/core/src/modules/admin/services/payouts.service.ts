import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: string, page = 1, pageSize = 20) {
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (page - 1) * take;
    const [lines, total] = await this.prisma.$transaction([
      this.prisma.payoutLine.findMany({
        where,
        include: { affiliate: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      this.prisma.payoutLine.count({ where })
    ]);
    const data = lines.map((l) => ({
      id: l.id,
      batchId: l.batchId,
      affiliateId: l.affiliateId,
      amount: Number(l.amount),
      currency: l.currency,
      status: l.status,
      scheduledFor: null,
      createdAt: l.createdAt
    }));
    return { data, meta: { page, pageSize: take, total } };
  }

  async getBatches(status?: string, page = 1, pageSize = 20) {
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (page - 1) * take;
    const [batches, total] = await this.prisma.$transaction([
      this.prisma.payoutBatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: { lines: true }
      }),
      this.prisma.payoutBatch.count({ where })
    ]);
    const data = batches.map((b) => ({
      batchId: b.id,
      count: b.lines.length,
      status: b.status,
      scheduledFor: b.periodEnd,
      createdAt: b.createdAt
    }));
    return { data, meta: { page, pageSize: take, total } };
  }

  async createBatch(affiliateIds: string[], scheduledFor: string) {
    const batch = await this.prisma.payoutBatch.create({
      data: {
        periodStart: new Date(),
        periodEnd: new Date(scheduledFor),
        lines: {
          create: affiliateIds.map((affId) => ({
            affiliateId: affId,
            amount: 0,
            currency: 'USD'
          }))
        }
      },
      include: { lines: true }
    });
    return { batchId: batch.id, count: batch.lines.length };
  }

  async updateStatus(id: string, status: 'paid' | 'failed', notes?: string) {
    const updated = await this.prisma.payoutLine.update({
      where: { id },
      data: { status, note: notes }
    });
    if (!updated) throw new NotFoundException('Payout not found');
    return {
      id: updated.id,
      batchId: updated.batchId,
      affiliateId: updated.affiliateId,
      amount: Number(updated.amount),
      currency: updated.currency,
      status: updated.status,
      scheduledFor: null,
      createdAt: updated.createdAt
    };
  }
}
