import { PrismaClient } from '@prisma/client';
import { Processor } from 'bullmq';
import { logger } from '../logger';

type FraudJobPayload = {
  windowMinutes?: number;
};

export async function runFraudScan(prisma: PrismaClient, windowMinutes = 10) {
  const clickWindow = new Date(Date.now() - windowMinutes * 60 * 1000);
  const orderWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const clicks = await prisma.click.groupBy({
    by: ['affiliateLinkId'],
    where: { clickedAt: { gte: clickWindow } },
    _count: { _all: true }
  });

  for (const c of clicks) {
    if (c._count._all > 20) {
      const link = await prisma.affiliateLink.findUnique({ where: { id: c.affiliateLinkId } });
      if (!link) continue;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
      const existing = await prisma.fraudAlert.findFirst({
        where: { affiliateId: link.affiliateId, type: 'velocity', clickId: null, status: 'open' }
      });
      if (!existing) {
        await prisma.fraudAlert.create({
          data: {
            affiliateId: link.affiliateId,
            riskScore: c._count._all,
            type: 'velocity',
            details: { count: c._count._all, windowMinutes },
            status: 'open'
          }
        });
      }
    }
  }



  const botClicks = await prisma.click.findMany({
    where: { clickedAt: { gte: clickWindow }, botFlags: { gt: 0 } },
    take: 50
  });
  for (const click of botClicks) {
    const link = await prisma.affiliateLink.findUnique({ where: { id: click.affiliateLinkId } });
    if (!link) continue;
    const existing = await prisma.fraudAlert.findFirst({
      where: { affiliateId: link.affiliateId, clickId: click.id, type: 'bot', status: 'open' }
    });
    if (!existing) {
      await prisma.fraudAlert.create({
        data: {
          affiliateId: link.affiliateId,
          clickId: click.id,
          riskScore: click.botFlags ?? 1,
          type: 'bot',
          details: { userAgent: click.userAgent, botFlags: click.botFlags },
          status: 'open'
        }
      });
    }
  }

  

  const orders = await prisma.order.findMany({
    where: { placedAt: { gte: orderWindow } },
    include: { attributions: true }
  });
  for (const order of orders) {
    for (const att of order.attributions) {
      if (order.customerHash && order.customerHash === att.affiliateId) {
        const existing = await prisma.fraudAlert.findFirst({
          where: { orderId: order.id, affiliateId: att.affiliateId, type: 'self_purchase', status: 'open' }
        });
        if (!existing) {
          await prisma.fraudAlert.create({
            data: {
              affiliateId: att.affiliateId,
              orderId: order.id,
              riskScore: 80,
              type: 'self_purchase',
              details: { customerHash: order.customerHash },
              status: 'open'
            }
          });
        }
      }
    }
  }
}

export const fraudProcessor =
  (prisma: PrismaClient): Processor<FraudJobPayload> =>
  async (job) => {
    logger.info({ jobId: job.id }, 'Running fraud processor');
    await runFraudScan(prisma, job.data.windowMinutes ?? 10);
    return { status: 'ok' };
  };
