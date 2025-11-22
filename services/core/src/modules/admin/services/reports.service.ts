import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(type?: string, range?: string) {
    // Minimal implementation: return recent audit logs as a placeholder report feed.
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    const data = logs.map((l) => ({
      id: l.id,
      type: type ?? 'summary',
      label: `${l.action} ${l.entityType ?? ''}`.trim(),
      generatedAt: l.createdAt.toISOString(),
      url: ''
    }));
    return { data };
  }

  async create(type: string, range: string, format: string) {
    // Stub creation: record an audit entry for report request.
    const entry = await this.prisma.auditLog.create({
      data: {
        action: 'REPORT_REQUESTED',
        entityType: 'report',
        meta: { type, range, format }
      }
    });
    return { id: entry.id, status: 'queued' };
  }
}
