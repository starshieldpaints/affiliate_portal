import { PrismaClient } from '@prisma/client';
import { Processor } from 'bullmq';
import { logger } from '../logger';
import fs from 'fs/promises';
import path from 'path';

type ReportJobPayload = {
  requestId: string;
  type: string;
  range: string;
  format: string;
};

export const reportProcessor =
  (prisma: PrismaClient): Processor<ReportJobPayload> =>
  async (job) => {
    logger.info({ jobId: job.id, requestId: job.data.requestId }, 'Generating report');
    const dir = path.join(process.cwd(), 'reports');
    await fs.mkdir(dir, { recursive: true });
    const filename = `report-${job.data.requestId}.csv`;
    const filePath = path.join(dir, filename);

    const orders = await prisma.order.count();
    const commissionSum = await prisma.commissionLedger.aggregate({
      _sum: { amount: true }
    });
    const header = 'metric,value';
    const rows = [`orders_count,${orders}`, `commission_sum,${commissionSum._sum.amount ?? 0}`];
    await fs.writeFile(filePath, [header, ...rows].join('\n'), 'utf8');

    await prisma.auditLog.create({
      data: {
        action: 'REPORT_READY',
        entityType: 'report',
        entityId: job.data.requestId,
        meta: {
          type: job.data.type,
          range: job.data.range,
          format: job.data.format,
          filePath,
          filename
        }
      }
    });
    return { status: 'ready', filePath };
  };
