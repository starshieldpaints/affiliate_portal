import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type RecordClickInput = {
  affiliateLinkId: string;
  cookieId?: string | null;
  sessionId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  referrer?: string | null;
  utm?: Record<string, string | undefined>;
};

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  findLinkByCode(code: string) {
    return this.prisma.affiliateLink.findUnique({
      where: { code },
      include: {
        affiliate: {
          select: { id: true }
        }
      }
    });
  }

  async recordClick({
    affiliateLinkId,
    cookieId,
    sessionId,
    userAgent,
    ipAddress,
    referrer,
    utm
  }: RecordClickInput) {
    return this.prisma.click.create({
      data: {
        affiliateLinkId,
        cookieId: cookieId ?? null,
        sessionId: sessionId ?? null,
        userAgent: userAgent ?? null,
        ipHash: ipAddress ? this.hashValue(ipAddress) : null,
        referrer: referrer ?? null,
        utm: (utm ?? null) as Prisma.InputJsonValue
      }
    });
  }

  private hashValue(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
