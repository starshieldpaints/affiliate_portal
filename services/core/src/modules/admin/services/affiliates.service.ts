import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AffiliateDto = {
  id: string;
  email: string;
  displayName: string;
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  kycStatus: 'pending' | 'verified' | 'rejected' | 'in_review';
  phone?: string | null;
  country?: string | null;
  payoutMethod?: string | null;
  payoutDetails?: Record<string, unknown> | null;
  panImageUrl?: string | null;
  aadhaarFrontUrl?: string | null;
  aadhaarBackUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  notes?: Array<{ id: string; message: string; createdAt: Date }>;
};

@Injectable()
export class AffiliatesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapStatus(userStatus: string): AffiliateDto['status'] {
    switch (userStatus) {
      case 'disabled':
        return 'blocked';
      case 'suspended':
        return 'inactive';
      default:
        return 'active';
    }
  }

  private toDto(affiliate: any): AffiliateDto {
    return {
      id: affiliate.id,
      email: affiliate.user.email,
      displayName: affiliate.displayName ?? affiliate.user.email,
      status: this.mapStatus(affiliate.user.status),
      kycStatus: affiliate.kycStatus ?? 'pending',
      phone: affiliate.phone,
      country: (affiliate.payoutDetails as any)?.country ?? null,
      payoutMethod: affiliate.payoutMethod,
      payoutDetails: affiliate.payoutDetails as any,
      panImageUrl: affiliate.panImageUrl,
      aadhaarFrontUrl: affiliate.aadhaarFrontUrl,
      aadhaarBackUrl: affiliate.aadhaarBackUrl,
      createdAt: affiliate.createdAt,
      updatedAt: affiliate.updatedAt,
      notes: []
    };
  }

  async list(params: {
    search?: string;
    status?: string;
    kycStatus?: string;
    country?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { search, status, kycStatus, country, page = 1, pageSize = 20 } = params;
    const where: any = {
      deletedAt: null,
      AND: []
    };
    if (search) {
      where.AND.push({
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      });
    }
    if (status && status !== 'all') {
      const statusMap: Record<string, string> = {
        active: 'active',
        inactive: 'suspended',
        blocked: 'disabled'
      };
      where.AND.push({ user: { status: statusMap[status] ?? 'active' } });
    }
    if (kycStatus && kycStatus !== 'all') {
      where.AND.push({ kycStatus });
    }
    if (country) {
      where.AND.push({ payoutDetails: { path: ['country'], equals: country } });
    }
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (page - 1) * take;

    const [records, total] = await this.prisma.$transaction([
      this.prisma.affiliateProfile.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      this.prisma.affiliateProfile.count({ where })
    ]);

    return {
      data: records.map((r) => this.toDto(r)),
      meta: { page, pageSize: take, total }
    };
  }

  async getById(id: string) {
    const record = await this.prisma.affiliateProfile.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!record) throw new NotFoundException('Affiliate not found');
    return this.toDto(record);
  }

  async update(id: string, input: Partial<AffiliateDto>) {
    const userStatusMap: Record<string, string> = {
      active: 'active',
      inactive: 'suspended',
      blocked: 'disabled'
    };
    const data: any = {};
    const userData: any = {};
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.kycStatus !== undefined && input.kycStatus !== 'in_review') data.kycStatus = input.kycStatus as any;
    if (input.payoutMethod !== undefined) data.payoutMethod = input.payoutMethod;
    if (input.payoutDetails !== undefined) data.payoutDetails = input.payoutDetails as any;
    if (input.status !== undefined) userData.status = userStatusMap[input.status] ?? 'active';

    const updated = await this.prisma.affiliateProfile.update({
      where: { id },
      data: {
        ...data,
        user: Object.keys(userData).length ? { update: userData } : undefined
      },
      include: { user: true }
    });
    return this.toDto(updated);
  }

  async decideKyc(id: string, decision: 'approve' | 'reject', reason?: string) {
    const kycStatus = decision === 'approve' ? 'verified' : 'rejected';
    const updated = await this.prisma.affiliateProfile.update({
      where: { id },
      data: { kycStatus },
      include: { user: true }
    });
    // Optionally log reason to audit log
    if (reason) {
      await this.prisma.auditLog.create({
        data: {
          action: 'AFFILIATE_KYC_DECISION',
          entityType: 'affiliate',
          entityId: id,
          meta: { decision, reason }
        }
      });
    }
    return this.toDto(updated);
  }

  async addNote(id: string, message: string) {
    await this.prisma.auditLog.create({
      data: {
        action: 'AFFILIATE_NOTE',
        entityType: 'affiliate',
        entityId: id,
        meta: { message }
      }
    });
    return { id: `note_${Date.now()}`, message, createdAt: new Date() };
  }
}
