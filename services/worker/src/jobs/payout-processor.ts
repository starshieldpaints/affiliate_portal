import type { PrismaClient } from '@prisma/client';
import type { Processor } from 'bullmq';
import { logger } from '../logger';

type PayoutJobPayload = {
  payoutBatchId: string;
};

export const payoutProcessor =
  (prisma: PrismaClient): Processor<PayoutJobPayload> =>
  async (job) => {
    logger.info({ jobId: job.id, payoutBatchId: job.data.payoutBatchId }, 'Dispatching payout batch');

    await prisma.payoutBatch.update({
      where: { id: job.data.payoutBatchId },
      data: {
        status: 'processing'
      }
    });

    await prisma.payoutBatch.update({
      where: { id: job.data.payoutBatchId },
      data: {
        status: 'paid'
      }
    });

    return { status: 'paid' };
  };
