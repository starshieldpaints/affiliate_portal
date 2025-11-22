import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const daysAgo = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d;
    };

    const [
      gmvAgg,
      ordersLast30,
      activeAffiliates,
      kycVerified,
      ordersToday,
      ordersLast7,
      refundsLast7,
      payoutReadyAgg,
      payoutProcessingAgg,
      payoutFailedAgg,
      payoutQueuedAgg,
      alertsOpen
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalGross: true },
        where: { placedAt: { gte: daysAgo(30) } }
      }),
      this.prisma.order.count({ where: { placedAt: { gte: daysAgo(30) } } }),
      this.prisma.affiliateProfile.count(),
      this.prisma.affiliateProfile.count({ where: { kycStatus: 'verified' } }),
      this.prisma.order.count({ where: { placedAt: { gte: daysAgo(0) } } }),
      this.prisma.order.count({ where: { placedAt: { gte: daysAgo(7) } } }),
      this.prisma.order.count({ where: { placedAt: { gte: daysAgo(7) }, paymentStatus: 'refunded' } }),
      this.prisma.payoutLine.aggregate({
        _count: true,
        _sum: { amount: true },
        where: { status: { in: ['pending', 'queued'] } }
      }),
      this.prisma.payoutLine.aggregate({
        _count: true,
        _sum: { amount: true },
        where: { status: 'processing' }
      }),
      this.prisma.payoutLine.aggregate({
        _count: true,
        _sum: { amount: true },
        where: { status: 'failed' }
      }),
      this.prisma.payoutLine.aggregate({
        _count: true,
        _sum: { amount: true },
        where: { status: 'queued' }
      }),
      0 // placeholder for fraud alerts, no table yet
    ]);

    const refundRate = ordersLast7 ? Math.round((refundsLast7 / ordersLast7) * 100) : 0;
    const payoutReady = Number(payoutReadyAgg._count ?? 0);
    const payoutProcessing = Number(payoutProcessingAgg._count ?? 0);
    const payoutFailed = Number(payoutFailedAgg._count ?? 0);
    const payoutQueued = Number(payoutQueuedAgg._count ?? 0);

    return {
      kpis: {
        gmv30d: Number(gmvAgg._sum.totalGross ?? 0),
        attributedOrders: ordersLast30,
        activeAffiliates,
        openAlerts: alertsOpen
      },
      activationFunnel: {
        signedUp: activeAffiliates,
        kycVerified,
        firstOrder: ordersLast30,
        payoutReady
      },
      payouts: {
        readyCount: payoutReady,
        readyAmount: Number(payoutReadyAgg._sum.amount ?? 0),
        processingCount: payoutProcessing,
        failedCount: payoutFailed
      },
      orders: {
        today: ordersToday,
        last7d: ordersLast7,
        refundRate,
        manualOverrides: 0
      },
      risk: {
        highRiskAlerts: alertsOpen,
        openAlerts: alertsOpen
      },
      payoutsQueue: {
        queued: payoutQueued,
        processing: payoutProcessing,
        failed: payoutFailed
      }
    };
  }
}
