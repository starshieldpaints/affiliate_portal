import { CommissionStatus, PaymentStatus } from '@prisma/client';
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

    const order = await prisma.order.findUnique({
      where: { id: job.data.orderId },
      select: { paymentStatus: true }
    });

    if (!order) {
      logger.warn({ orderId: job.data.orderId }, 'Order not found for commission processing');
      return { status: 'skipped' };
    }

    if (order.paymentStatus === PaymentStatus.paid) {
      await prisma.commissionLedger.updateMany({
        where: {
          orderId: job.data.orderId,
          status: CommissionStatus.pending
        },
        data: {
          status: CommissionStatus.approved
        }
      });
      return { status: 'approved' };
    }

    if (
      order.paymentStatus === PaymentStatus.refunded ||
      order.paymentStatus === PaymentStatus.canceled
    ) {
      await prisma.commissionLedger.updateMany({
        where: {
          orderId: job.data.orderId,
          status: {
            in: [CommissionStatus.pending, CommissionStatus.approved]
          }
        },
        data: {
          status: CommissionStatus.reversed
        }
      });
      return { status: 'reversed' };
    }

    logger.info(
      { orderId: job.data.orderId, paymentStatus: order.paymentStatus },
      'Order not yet payable'
    );
    return { status: 'pending' };
  };
