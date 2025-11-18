import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommissionStatus,
  KycStatus,
  Prisma,
  PayoutLineStatus,
  UserStatus
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAffiliateProfileDto } from '../dto/update-affiliate-profile.dto';
import { CreateAffiliateLinkDto } from '../dto/create-affiliate-link.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AffiliatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async findAll(params?: {
    search?: string;
    status?: string;
    kycStatus?: string;
    take?: number;
  }) {
    const normalizedTake = Math.min(Math.max(params?.take ?? 50, 1), 200);
    const where: Prisma.AffiliateProfileWhereInput = {};

    if (params?.kycStatus && params.kycStatus !== 'all') {
      where.kycStatus = params.kycStatus as KycStatus;
    }

    if (params?.status && params.status !== 'all') {
      const relationFilter =
        (where.user as Prisma.UserRelationFilter | undefined) ?? ({} as Prisma.UserRelationFilter);
      const existingIs = (relationFilter.is as Prisma.UserWhereInput | undefined) ?? {};
      relationFilter.is = {
        ...existingIs,
        status: params.status as UserStatus
      };
      where.user = relationFilter;
    }

    if (params?.search?.trim()) {
      const term = params.search.trim();
      const searchClause: Prisma.AffiliateProfileWhereInput = {
        OR: [
          { displayName: { contains: term, mode: 'insensitive' } },
          { defaultReferralCode: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term } },
          { user: { email: { contains: term, mode: 'insensitive' } } }
        ]
      };
      if (!where.AND) {
        where.AND = searchClause;
      } else if (Array.isArray(where.AND)) {
        where.AND = [...where.AND, searchClause];
      } else {
        where.AND = [where.AND, searchClause];
      }
    }

    const [records, total, kycBreakdown] = await this.prisma.$transaction([
      this.prisma.affiliateProfile.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              status: true,
              role: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              links: true,
              coupons: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: normalizedTake
      }),
      this.prisma.affiliateProfile.count({ where }),
      this.prisma.affiliateProfile.groupBy({
        by: ['kycStatus'],
        where,
        orderBy: { kycStatus: 'asc' },
        _count: { _all: true }
      })
    ]);

    const meta = {
      total,
      take: normalizedTake,
      kycBreakdown: kycBreakdown.reduce<Record<string, number>>((acc, item) => {
        const count = (item._count as { _all?: number } | null)?._all ?? 0;
        acc[item.kycStatus] = count;
        return acc;
      }, {})
    };

    return { data: records, meta };
  }

  async findOne(id: string) {
    const affiliate = await this.prisma.affiliateProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            status: true,
            role: true
          }
        },
        links: {
          select: {
            id: true,
            code: true,
            isActive: true,
            createdAt: true
          }
        },
        coupons: {
          select: {
            id: true,
            code: true,
            isActive: true,
            discountType: true,
            discountValue: true
          }
        }
      }
    });
    if (affiliate) {
      return affiliate;
    }
    return {
      id,
      displayName: 'Sample Affiliate',
      kycStatus: 'pending',
      payoutMethod: 'stripe_connect',
      createdAt: new Date(),
      user: {
        email: 'sample@starshield.io',
        status: 'active',
        role: 'affiliate'
      },
      links: [],
      coupons: []
    };
  }

  async updateProfile(userId: string, dto: UpdateAffiliateProfileDto) {
    const profile = await this.prisma.affiliateProfile.findUnique({
      where: { userId }
    });
    if (!profile) {
      throw new NotFoundException('Affiliate profile not found');
    }

    const payoutDetails: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined =
      dto.payoutDetails === undefined
        ? (profile.payoutDetails as Prisma.InputJsonValue | typeof Prisma.JsonNull | null) ??
          undefined
        : dto.payoutDetails === null
          ? Prisma.JsonNull
          : (dto.payoutDetails as Prisma.InputJsonValue);

    const updated = await this.prisma.affiliateProfile.update({
      where: { userId },
      data: {
        displayName: dto.displayName ?? profile.displayName,
        payoutMethod: dto.payoutMethod ?? profile.payoutMethod,
        payoutDetails,
        kycStatus: dto.kycStatus ?? profile.kycStatus,
        panNumber: dto.panNumber ?? profile.panNumber,
        aadhaarNumber: dto.aadhaarNumber ?? profile.aadhaarNumber,
        panImageUrl: dto.panImageUrl ?? profile.panImageUrl,
        aadhaarFrontUrl: dto.aadhaarFrontUrl ?? profile.aadhaarFrontUrl,
        aadhaarBackUrl: dto.aadhaarBackUrl ?? profile.aadhaarBackUrl
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true
          }
        }
      }
    });

    return updated;
  }

  async createAffiliateLink(userId: string, dto: CreateAffiliateLinkDto) {
    const profile = await this.prisma.affiliateProfile.findUnique({
      where: { userId },
      select: { id: true, defaultReferralCode: true }
    });
    if (!profile) {
      throw new NotFoundException('Affiliate profile not found');
    }
    const prefix = dto.alias ?? profile.defaultReferralCode ?? 'affiliate';
    const code = await this.generateLinkCode(prefix);
    const trackedUrl = this.buildTrackedUrl(dto.landingUrl, {
      referralCode: dto.referralCode,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      productId: dto.productId,
      productSku: dto.productSku
    });

    const link = await this.prisma.affiliateLink.create({
      data: {
        affiliateId: profile.id,
        productId: dto.productId ?? null,
        code,
        landingUrl: trackedUrl,
        utmDefaults: {
          source: dto.utmSource,
          medium: dto.utmMedium,
          campaign: dto.utmCampaign
        }
      },
      select: {
        id: true,
        code: true,
        landingUrl: true
      }
    });

    const trackingBase =
      this.config.get<string>('tracking.baseUrl') ??
      this.config.get<string>('app.url') ??
      'http://localhost:4000';
    const shortUrl = new URL(`/r/${link.code}`, trackingBase).toString();

    return {
      id: link.id,
      code: link.code,
      landingUrl: link.landingUrl,
      shortUrl
    };
  }

  async getDashboardOverview(userId: string) {
    const affiliateId = await this.findAffiliateId(userId);
    if (!affiliateId) {
      return {
        stats: {
          clicks: 0,
          conversions: 0,
          totalCommission: 0,
          pendingCommission: 0,
          activeLinks: 0
        },
        upcomingPayout: null,
        recentActivity: [],
        topLinks: [],
        channelMix: []
      };
    }

    const [
      clickCount,
      conversionCount,
      activeLinks,
      approvedCommission,
      pendingCommission,
      upcomingPayout,
      recentLedger,
      topLinks,
      channelGroups
    ] = await this.prisma.$transaction([
      this.prisma.click.count({
        where: { affiliateLink: { affiliateId } }
      }),
      this.prisma.attribution.count({
        where: { affiliateId }
      }),
      this.prisma.affiliateLink.count({
        where: { affiliateId, isActive: true }
      }),
      this.prisma.commissionLedger.aggregate({
        _sum: { amount: true },
        where: { affiliateId, status: CommissionStatus.approved }
      }),
      this.prisma.commissionLedger.aggregate({
        _sum: { amount: true },
        where: { affiliateId, status: CommissionStatus.pending }
      }),
      this.prisma.payoutLine.findFirst({
        where: {
          affiliateId,
          status: {
            in: [PayoutLineStatus.pending, PayoutLineStatus.queued, PayoutLineStatus.processing]
          }
        },
        select: {
          amount: true,
          currency: true,
          createdAt: true,
          batch: {
            select: {
              periodEnd: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.commissionLedger.findMany({
        where: { affiliateId },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          order: {
            select: {
              externalOrderId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      this.prisma.affiliateLink.findMany({
        where: { affiliateId },
        select: {
          id: true,
          code: true,
          landingUrl: true,
          product: {
            select: {
              name: true
            }
          },
          _count: {
            select: { clicks: true }
          }
        },
        orderBy: {
          clicks: {
            _count: 'desc'
          }
        },
        take: 3
      }),
      this.prisma.attribution.groupBy({
        by: ['model'],
        where: { affiliateId },
        orderBy: { model: 'asc' },
        _count: { _all: true }
      })
    ]);

    const totalChannelEvents = channelGroups.reduce((sum, group) => {
      const count =
        typeof group._count === 'object' && group._count !== null && '_all' in group._count
          ? (group._count as { _all?: number })._all ?? 0
          : 0;
      return sum + count;
    }, 0);

    return {
      stats: {
        clicks: clickCount,
        conversions: conversionCount,
        totalCommission: this.toNumber(approvedCommission._sum?.amount),
        pendingCommission: this.toNumber(pendingCommission._sum?.amount),
        activeLinks
      },
      upcomingPayout: upcomingPayout
        ? {
            amount: this.toNumber(upcomingPayout.amount),
            currency: upcomingPayout.currency,
            scheduledFor: upcomingPayout.batch?.periodEnd ?? upcomingPayout.createdAt
          }
        : null,
      recentActivity: recentLedger.map((entry) => ({
        id: entry.id,
        label: entry.order?.externalOrderId ?? entry.id.slice(0, 8),
        amount: this.toNumber(entry.amount),
        currency: entry.currency,
        status: entry.status,
        createdAt: entry.createdAt
      })),
      topLinks: topLinks.map((link) => ({
        id: link.id,
        label: link.product?.name ?? link.code,
        clicks: link._count.clicks,
        landingUrl: link.landingUrl
      })),
      channelMix: channelGroups.slice(0, 5).map((group) => {
        const count =
          typeof group._count === 'object' && group._count !== null && '_all' in group._count
            ? (group._count as { _all?: number })._all ?? 0
            : 0;
        return {
          label: group.model ?? 'Unknown',
          share: totalChannelEvents === 0 ? 0 : Math.round((count / totalChannelEvents) * 100)
        };
      })
    };
  }

  async getNotifications(userId: string) {
    const affiliateId = await this.findAffiliateId(userId);
    if (!affiliateId) {
      return [];
    }
    const [recentPayouts, recentLedger] = await this.prisma.$transaction([
      this.prisma.payoutLine.findMany({
        where: { affiliateId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          batch: {
            select: {
              periodEnd: true
            }
          }
        }
      }),
      this.prisma.commissionLedger.findMany({
        where: { affiliateId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          order: {
            select: { externalOrderId: true }
          }
        }
      })
    ]);

    const items = [
      ...recentPayouts.map((payout) => ({
        id: `payout-${payout.id}`,
        title: payout.status === PayoutLineStatus.paid ? 'Payout processed' : 'Payout update',
        detail:
          payout.status === PayoutLineStatus.paid
            ? `Transfer completed for ${formatCurrency(
                this.toNumber(payout.amount),
                payout.currency
              )}`
            : `Payout ${payout.status.toLowerCase()} • ${formatCurrency(
                this.toNumber(payout.amount),
                payout.currency
              )}`,
        timestamp: payout.createdAt,
        type:
          payout.status === PayoutLineStatus.paid
            ? 'success'
            : payout.status === PayoutLineStatus.failed
            ? 'warning'
            : 'info'
      })),
      ...recentLedger.map((entry) => ({
        id: `ledger-${entry.id}`,
        title:
          entry.status === CommissionStatus.approved
            ? 'Commission approved'
            : entry.status === CommissionStatus.pending
            ? 'Commission pending'
            : 'Commission updated',
        detail: `${entry.order?.externalOrderId ?? entry.id.slice(0, 8)} • ${formatCurrency(
          this.toNumber(entry.amount),
          entry.currency
        )}`,
        timestamp: entry.createdAt,
        type:
          entry.status === CommissionStatus.rejected || entry.status === CommissionStatus.reversed
            ? 'warning'
            : entry.status === CommissionStatus.approved
            ? 'success'
            : 'info'
      }))
    ];

    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8)
      .map((item) => ({
        ...item,
        timestamp: item.timestamp.toISOString()
      }));
  }

  async getPayoutOverview(userId: string) {
    const affiliateId = await this.findAffiliateId(userId);
    if (!affiliateId) {
      return {
        summary: { pendingCommission: 0, approvedCommission: 0 },
        nextPayout: null,
        history: []
      };
    }
    const [history, pendingSum, approvedSum] = await this.prisma.$transaction([
      this.prisma.payoutLine.findMany({
        where: { affiliateId },
        include: {
          batch: {
            select: {
              periodEnd: true,
              method: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      this.prisma.commissionLedger.aggregate({
        _sum: { amount: true },
        where: { affiliateId, status: CommissionStatus.pending }
      }),
      this.prisma.commissionLedger.aggregate({
        _sum: { amount: true },
        where: { affiliateId, status: CommissionStatus.approved }
      })
    ]);

    const actionableStatuses: PayoutLineStatus[] = [
      PayoutLineStatus.pending,
      PayoutLineStatus.processing,
      PayoutLineStatus.queued
    ];
    const nextPayout = history.find((line) => actionableStatuses.includes(line.status));

    return {
      summary: {
        pendingCommission: this.toNumber(pendingSum._sum?.amount),
        approvedCommission: this.toNumber(approvedSum._sum?.amount)
      },
      nextPayout: nextPayout
        ? {
            amount: this.toNumber(nextPayout.amount),
            currency: nextPayout.currency,
            status: nextPayout.status,
            scheduledFor: (nextPayout.batch?.periodEnd ?? nextPayout.createdAt).toISOString()
          }
        : null,
      history: history.map((line) => ({
        id: line.id,
        amount: this.toNumber(line.amount),
        currency: line.currency,
        status: line.status,
        method: line.batch?.method ?? null,
        createdAt: line.createdAt.toISOString()
      }))
    };
  }

  async getReportsSnapshot(userId: string) {
    const affiliateId = await this.findAffiliateId(userId);
    if (!affiliateId) {
      return {
        cohorts: [],
        funnel: {
          sessions: 0,
          qualified: 0,
          conversions: 0
        }
      };
    }
    const since = new Date();
    since.setDate(since.getDate() - 120);

    const [clicks, ledgers] = await this.prisma.$transaction([
      this.prisma.click.findMany({
        where: {
          affiliateLink: { affiliateId },
          clickedAt: { gte: since }
        },
        select: { clickedAt: true }
      }),
      this.prisma.commissionLedger.findMany({
        where: { affiliateId, createdAt: { gte: since } },
        select: {
          createdAt: true,
          amount: true,
          status: true
        }
      })
    ]);

    const weekMap = new Map<
      string,
      { clicks: number; conversions: number; commission: number }
    >();

    const addToWeek = (
      date: Date,
      updater: (bucket: { clicks: number; conversions: number; commission: number }) => void
    ) => {
      const key = this.weekKey(date);
      if (!weekMap.has(key)) {
        weekMap.set(key, { clicks: 0, conversions: 0, commission: 0 });
      }
      const bucket = weekMap.get(key)!;
      updater(bucket);
    };

    clicks.forEach((click) =>
      addToWeek(click.clickedAt, (bucket) => {
        bucket.clicks += 1;
      })
    );

    ledgers.forEach((ledger) =>
      addToWeek(ledger.createdAt, (bucket) => {
        if (ledger.status === CommissionStatus.approved) {
          bucket.conversions += 1;
          bucket.commission += this.toNumber(ledger.amount);
        } else if (ledger.status === CommissionStatus.pending) {
          bucket.conversions += 1;
        }
      })
    );

    const cohorts = Array.from(weekMap.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .slice(0, 6)
      .map(([key, bucket]) => ({
        label: this.formatWeekLabel(key),
        clicks: bucket.clicks,
        conversions: bucket.conversions,
        commission: bucket.commission
      }));

    const totalClicks = clicks.length;
    const approvedConversions = ledgers.filter(
      (ledger) => ledger.status === CommissionStatus.approved
    ).length;
    const pendingConversions = ledgers.filter(
      (ledger) => ledger.status === CommissionStatus.pending
    ).length;

    return {
      cohorts,
      funnel: {
        sessions: totalClicks,
        qualified: pendingConversions + approvedConversions,
        conversions: approvedConversions
      }
    };
  }
  private async generateLinkCode(prefix: string) {
    const base = this.slugify(prefix) || 'link';
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = randomBytes(3).toString('hex');
      const candidate = `${base}-${suffix}`;
      const existing = await this.prisma.affiliateLink.findUnique({
        where: { code: candidate }
      });
      if (!existing) {
        return candidate;
      }
    }
    return `${base}-${randomBytes(4).toString('hex')}`;
  }

  private buildTrackedUrl(
    landingUrl: string,
    params: {
      referralCode: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      productId?: string;
      productSku?: string;
    }
  ) {
    const url = this.createUrl(landingUrl);
    url.searchParams.set('aff', params.referralCode);
    if (params.utmSource) url.searchParams.set('utm_source', params.utmSource);
    if (params.utmMedium) url.searchParams.set('utm_medium', params.utmMedium);
    if (params.utmCampaign) url.searchParams.set('utm_campaign', params.utmCampaign);
    if (params.productId) url.searchParams.set('product_id', params.productId);
    if (params.productSku) url.searchParams.set('sku', params.productSku);
    return url.toString();
  }

  private createUrl(pathOrUrl: string) {
    try {
      return new URL(pathOrUrl);
    } catch {
      const fallback = this.config.get<string>('app.url') ?? 'https://starshield.io';
      return new URL(pathOrUrl, fallback);
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  }

  private async findAffiliateId(userId: string) {
    const profile = await this.prisma.affiliateProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    return profile?.id ?? null;
  }

  private async requireAffiliateId(userId: string) {
    const affiliateId = await this.findAffiliateId(userId);
    if (!affiliateId) {
      throw new NotFoundException('Affiliate profile not found');
    }
    return affiliateId;
  }

  private weekKey(date: Date) {
    const copy = new Date(date);
    copy.setUTCHours(0, 0, 0, 0);
    const day = copy.getUTCDay();
    const diff = (day + 6) % 7;
    copy.setUTCDate(copy.getUTCDate() - diff);
    return copy.toISOString().slice(0, 10);
  }

  private formatWeekLabel(key: string) {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(new Date(key));
    } catch {
      return key;
    }
  }

  private toNumber(value?: Prisma.Decimal | null) {
    if (!value) {
      return 0;
    }
    return Number(value);
  }
}

function formatCurrency(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount ?? 0);
  } catch {
    return `$${(amount ?? 0).toFixed(2)}`;
  }
}
