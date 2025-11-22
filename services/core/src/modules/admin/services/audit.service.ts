import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditEntry = {
  id: string;
  actor: string | null;
  action: string;
  targetId: string | null;
  createdAt: Date;
  meta?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    actorEmail?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { actorEmail, action, from, to, page = 1, pageSize = 50 } = params;
    const where: any = {};
    if (actorEmail) where.user = { email: actorEmail };
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    const take = Math.min(Math.max(pageSize, 1), 200);
    const skip = (page - 1) * take;
    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      this.prisma.auditLog.count({ where })
    ]);
    const data: AuditEntry[] = logs.map((l) => ({
      id: l.id,
      actor: l.user?.email ?? null,
      action: l.action,
      targetId: l.entityId,
      createdAt: l.createdAt,
      meta: l.meta as any
    }));
    return { data, meta: { page, pageSize: take, total } };
  }

  async exportCsv(params: { actorEmail?: string; action?: string; from?: string; to?: string }) {
    const list = await this.list({ ...params, page: 1, pageSize: 1000 });
    const header = 'id,actor,action,targetId,createdAt';
    const rows = list.data.map((e) => `${e.id},${e.actor ?? ''},${e.action},${e.targetId ?? ''},${e.createdAt.toISOString()}`);
    return [header, ...rows].join('\n');
  }
}
