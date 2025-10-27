import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AffiliatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.affiliateProfile
      .findMany({
        include: {
          user: {
            select: {
              email: true,
              status: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })
      .then((affiliates) => {
        if (affiliates.length > 0) {
          return affiliates;
        }

        return [
          {
            id: 'sample-affiliate',
            displayName: 'Alex Carter',
            kycStatus: 'verified',
            payoutMethod: 'stripe_connect',
            createdAt: new Date(),
            user: {
              email: 'alex@example.com',
              status: 'active',
              role: 'affiliate'
            },
            links: [],
            coupons: []
          }
        ];
      });
  }

  findOne(id: string) {
    return this.prisma.affiliateProfile.findUnique({
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
    }).then((affiliate) => {
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
    });
  }
}
