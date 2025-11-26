import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type ListParams = { status?: string; type?: string; page?: number; pageSize?: number };

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: ListParams) {
    const { status, type, page = 1, pageSize = 20 } = params;
    const where: Prisma.FraudAlertWhereInput = {};
    if (status && status !== 'all') where.status = status;
    if (type) where.type = type;
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (page - 1) * take;
    const [alerts, total] = await this.prisma.$transaction([
      this.prisma.fraudAlert.findMany({
        where,
        include: { affiliate: true, order: true, click: true, resolvedBy: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      this.prisma.fraudAlert.count({ where })
    ]);

    return {
      meta: { page, pageSize: take, total, totalPages: Math.ceil(total / take) || 1 },
      data: alerts.map((a) => this.mapAlert(a))
    };
  }

  async get(id: string) {
    const alert = await this.prisma.fraudAlert.findUnique({
      where: { id },
      include: { affiliate: true, order: true, click: true, resolvedBy: true }
    });
    if (!alert) throw new NotFoundException('Fraud alert not found');
    return { data: this.mapAlert(alert) };
  }

  async resolve(id: string, userId: string, notes?: string) {
    const alert = await this.prisma.fraudAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Fraud alert not found');
    const updated = await this.prisma.fraudAlert.update({
      where: { id },
      data: { status: 'resolved', notes, resolvedById: userId, resolvedAt: new Date() }
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'FRAUD_RESOLVE',
        entityType: 'fraud_alert',
        entityId: id,
        meta: { notes }
      }
    });
    return { ok: true, data: this.mapAlert(updated) };
  }

  private mapAlert(a: any) {
    return {
      id: a.id,
      type: a.type,
      affiliateId: a.affiliateId,
      orderId: a.orderId,
      clickId: a.clickId,
      riskScore: Number(a.riskScore),
      status: a.status,
      notes: a.notes ?? null,
      resolvedAt: a.resolvedAt,
      resolvedBy: a.resolvedById ?? null,
      createdAt: a.createdAt
    };
  }
}
