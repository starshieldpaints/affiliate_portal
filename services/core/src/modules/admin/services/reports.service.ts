import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(type?: string, range?: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { action: 'REPORT_READY' },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    const data = logs.map((l) => ({
      id: l.id,
      type: (l.meta as any)?.type ?? type ?? 'summary',
      range: (l.meta as any)?.range ?? range ?? 'recent',
      generatedAt: l.createdAt.toISOString(),
      filename: (l.meta as any)?.filename ?? 'report.csv'
    }));
    return { data };
  }

  async create(type: string, range: string, format: string) {
    const request = await this.prisma.auditLog.create({
      data: {
        action: 'REPORT_REQUESTED',
        entityType: 'report',
        meta: { type, range, format }
      }
    });
    const ready = await this.generateCsvReport(request.id, type, range, format);
    return { id: ready.id, status: 'ready' };
  }

  async generateCsvReport(requestId: string, type: string, range: string, format: string) {
    const dir = path.join(process.cwd(), 'reports');
    await fsp.mkdir(dir, { recursive: true });
    const filename = `report-${requestId}.csv`;
    const filePath = path.join(dir, filename);

    // Collect simple aggregate: total orders and commissions.
    const orders = await this.prisma.order.count();
    const commissionSum = await this.prisma.commissionLedger.aggregate({
      _sum: { amount: true }
    });

    const header = 'metric,value';
    const rows = [`orders_count,${orders}`, `commission_sum,${commissionSum._sum.amount ?? 0}`];
    await fsp.writeFile(filePath, [header, ...rows].join('\n'), 'utf8');

    const ready = await this.prisma.auditLog.create({
      data: {
        action: 'REPORT_READY',
        entityType: 'report',
        entityId: requestId,
        meta: { type, range, format, filePath, filename }
      }
    });
    return ready;
  }

  async getReportFile(id: string) {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log || log.action !== 'REPORT_READY') {
      throw new NotFoundException('Report not ready');
    }
    const meta = log.meta as any;
    if (!meta?.filePath || !fs.existsSync(meta.filePath)) {
      throw new NotFoundException('Report file missing');
    }
    return { path: meta.filePath, filename: meta.filename ?? 'report.csv' };
  }

  async streamReport(id: string, res: any) {
    const file = await this.getReportFile(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    await pipeline(fs.createReadStream(file.path), res);
  }

  async getReportBuffer(id: string): Promise<Buffer> {
    const file = await this.getReportFile(id);
    return fsp.readFile(file.path);
  }
}
