import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type Alert = {
  id: string;
  type: string;
  subjectId: string;
  riskScore: number;
  status: 'open' | 'closed';
  createdAt: Date;
  note?: string;
};

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { status?: string; type?: string; page?: number; pageSize?: number }) {
    const { status, type, page = 1, pageSize = 20 } = params;
    // No fraud table exists; derive alerts from audit logs tagged as FRAUD_ALERT.
    const where: any = { action: 'FRAUD_ALERT' };
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (page - 1) * take;
    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      this.prisma.auditLog.count({ where })
    ]);

    let alerts: Alert[] = logs.map((l) => ({
      id: l.id,
      type: (l.meta as any)?.type ?? 'unknown',
      subjectId: l.entityId ?? 'unknown',
      riskScore: Number((l.meta as any)?.riskScore ?? 0),
      status: ((l.meta as any)?.status as 'open' | 'closed') ?? 'open',
      createdAt: l.createdAt,
      note: (l.meta as any)?.note
    }));
    if (status && status !== 'all') alerts = alerts.filter((a) => a.status === status);
    if (type) alerts = alerts.filter((a) => a.type === type);

    return { data: alerts, meta: { page, pageSize: take, total } };
  }

  async get(id: string): Promise<Alert> {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log || log.action !== 'FRAUD_ALERT') throw new NotFoundException('Alert not found');
    return {
      id: log.id,
      type: (log.meta as any)?.type ?? 'unknown',
      subjectId: log.entityId ?? 'unknown',
      riskScore: Number((log.meta as any)?.riskScore ?? 0),
      status: ((log.meta as any)?.status as 'open' | 'closed') ?? 'open',
      createdAt: log.createdAt,
      note: (log.meta as any)?.note
    };
  }

  async update(id: string, status: 'open' | 'closed', note?: string) {
    const current = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!current || current.action !== 'FRAUD_ALERT') throw new NotFoundException('Alert not found');
    const meta = { ...(current.meta as any), status, note };
    const updated = await this.prisma.auditLog.update({
      where: { id },
      data: { meta }
    });
    return {
      id: updated.id,
      type: (updated.meta as any)?.type ?? 'unknown',
      subjectId: updated.entityId ?? 'unknown',
      riskScore: Number((updated.meta as any)?.riskScore ?? 0),
      status: ((updated.meta as any)?.status as 'open' | 'closed') ?? 'open',
      createdAt: updated.createdAt,
      note: (updated.meta as any)?.note
    };
  }
}
