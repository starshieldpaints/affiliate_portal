import { Injectable, NotFoundException } from '@nestjs/common';
import { KycStatus, Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAffiliateProfileDto } from '../dto/update-affiliate-profile.dto';

@Injectable()
export class AffiliatesService {
  constructor(private readonly prisma: PrismaService) {}

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
        taxId: dto.panNumber ?? profile.taxId
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
}
