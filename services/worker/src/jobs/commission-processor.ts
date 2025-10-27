import type { PrismaClient } from '@prisma/client';
import type { Processor } from 'bullmq';
import { logger } from '../logger';

type CommissionJobPayload = {
  orderId: string;
};

export const commissionProcessor =
  (prisma: PrismaClient): Processor<CommissionJobPayload> =>
  async (job) => {
    logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Processing commission job');

    // Placeholder implementation for commission calculation orchestration.
    await prisma.commissionLedger.updateMany({
      where: {
        orderId: job.data.orderId,
        status: 'pending'
      },
      data: {
        status: 'approved'
      }
    });

    return { status: 'approved' };
  };
