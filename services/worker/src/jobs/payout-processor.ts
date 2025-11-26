import type { PayoutBatchStatus, PayoutLineStatus, PrismaClient } from '@prisma/client';
import type { Processor } from 'bullmq';
import { logger } from '../logger';
import { StubPayoutProvider } from '../../../core/src/modules/payouts/providers/stub-payout.provider';

type PayoutJobPayload = {
  payoutBatchId: string;
};

export const payoutProcessor =
  (prisma: PrismaClient): Processor<PayoutJobPayload> =>
  async (job) => {
    logger.info({ jobId: job.id, payoutBatchId: job.data.payoutBatchId }, 'Dispatching payout batch');

    const batch = await prisma.payoutBatch.update({
      where: { id: job.data.payoutBatchId },
      data: {
        status: 'processing'
      },
      include: { lines: true }
    });

    const provider = new StubPayoutProvider();
    const result = await provider.submitBatch(batch, batch.lines);
    const batchStatus: PayoutBatchStatus = result.status === 'paid' ? 'paid' : 'failed';
    const lineStatus: PayoutLineStatus = result.status === 'paid' ? 'paid' : 'failed';

    await prisma.$transaction([
      prisma.payoutBatch.update({
        where: { id: job.data.payoutBatchId },
        data: {
          status: batchStatus,
          providerBatchId: result.providerBatchId,
          receiptUrl: result.receiptUrl
        }
      }),
      prisma.payoutLine.updateMany({
        where: { batchId: job.data.payoutBatchId },
        data: { status: lineStatus }
      })
    ]);

    return { status: batchStatus };
  };
