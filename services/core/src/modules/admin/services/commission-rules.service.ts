import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, CommissionRule } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommissionRuleDto } from '../dto/commission-rule.dto';

type ListParams = {
  status?: 'all' | 'active' | 'inactive';
  search?: string;
  page?: number;
  pageSize?: number;
};

type RuleWithScopes = Prisma.CommissionRuleGetPayload<{
  include: {
    scopes: {
      include: {
        product: { select: { id: true; name: true } };
        category: { select: { id: true; name: true } };
        affiliate: { select: { id: true; displayName: true; defaultReferralCode: true } };
      };
    };
  };
}>;

@Injectable()
export class CommissionRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: ListParams = {}) {
    const where = this.buildWhereClause(params);
    const take = Math.min(Math.max(params.pageSize ?? 20, 1), 200);
    const page = params.page && params.page > 0 ? params.page : 1;
    const skip = (page - 1) * take;

    const [rules, total] = await this.prisma.$transaction([
      this.prisma.commissionRule.findMany({
        where,
        include: this.scopeInclude(),
        orderBy: [{ isActive: 'desc' }, { startsAt: 'desc' }],
        take,
        skip
      }),
      this.prisma.commissionRule.count({ where })
    ]);

    const stats = { active: 0, scheduled: 0, expired: 0, inactive: 0 };
    const data = (rules as unknown as RuleWithScopes[]).map((rule) => {
      const status = this.deriveStatus(rule);
      if (status in stats) {
        stats[status as keyof typeof stats] += 1;
      }
      return this.serializeRule(rule, status);
    });

    return {
      data,
      meta: {
        total,
        page,
        pageSize: take,
        pageCount: Math.ceil(total / take),
        statusCounts: stats
      }
    };
  }

  async getById(id: string) {
    const record = (await this.prisma.commissionRule.findUnique({
      where: { id },
      include: this.scopeInclude()
    })) as RuleWithScopes | null;
    if (!record) {
      throw new NotFoundException('Commission rule not found');
    }
    return this.serializeRule(record, this.deriveStatus(record));
  }

  private buildWhereClause(params: ListParams): Prisma.CommissionRuleWhereInput {
    const where: Prisma.CommissionRuleWhereInput = {};
    const filters: Prisma.CommissionRuleWhereInput[] = [];

    if (params.search?.trim()) {
      const term = params.search.trim();
      filters.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { type: { contains: term, mode: 'insensitive' } }
        ]
      });
    }

    if (params.status && params.status !== 'all') {
      const now = new Date();
      switch (params.status) {
        case 'active':
          filters.push({
            isActive: true,
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
          });
          break;
        case 'inactive':
          filters.push({
            isActive: false
          });
          break;
        default:
          break;
      }
    }

    if (filters.length) {
      where.AND = filters;
    }

    return where;
  }

  async createRule(input: CreateCommissionRuleDto) {
    const payload: Prisma.CommissionRuleCreateInput = {
      name: input.name.trim(),
      type: input.rateType.trim(),
      rate: new Prisma.Decimal(input.rateValue),
      excludeTaxShipping: input.excludeTaxShipping ?? true,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      conditions: input.conditions ?? undefined,
      isActive: input.status ? input.status === 'active' : true
    };

    const scopeCreates: Prisma.CommissionRuleScopeCreateWithoutCommissionRuleInput[] = [];
    if (input.categoryIds?.length) {
      scopeCreates.push(
        ...input.categoryIds.map((id) => ({
          category: { connect: { id } }
        }))
      );
    }
    if (input.productIds?.length) {
      scopeCreates.push(
        ...input.productIds.map((id) => ({
          product: { connect: { id } }
        }))
      );
    }
    if (scopeCreates.length) {
      payload.scopes = {
        create: scopeCreates
      };
    }

    const created = (await this.prisma.commissionRule.create({
      data: payload,
      include: this.scopeInclude()
    })) as unknown as RuleWithScopes;

    return this.serializeRule(created, this.deriveStatus(created));
  }

  async updateRule(id: string, input: Partial<CreateCommissionRuleDto>) {
    const existing = await this.prisma.commissionRule.findUnique({
      where: { id },
      include: { scopes: true }
    });
    if (!existing) {
      throw new NotFoundException('Commission rule not found');
    }
    const data: Prisma.CommissionRuleUpdateInput = {};
    if (input.name) data.name = input.name.trim();
    if (input.rateType) data.type = input.rateType.trim();
    if (typeof input.rateValue === 'number') data.rate = new Prisma.Decimal(input.rateValue);
    if (typeof input.excludeTaxShipping === 'boolean') data.excludeTaxShipping = input.excludeTaxShipping;
    if (input.status) data.isActive = input.status === 'active';
    if (input.startsAt !== undefined) data.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.endsAt !== undefined) data.endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (input.conditions !== undefined) data.conditions = input.conditions as Prisma.InputJsonValue;

    if ((input.categoryIds && input.categoryIds.length) || (input.productIds && input.productIds.length)) {
      data.scopes = {
        deleteMany: { commissionRuleId: id },
        create: [
          ...(input.categoryIds?.map((cid) => ({ category: { connect: { id: cid } } })) ?? []),
          ...(input.productIds?.map((pid) => ({ product: { connect: { id: pid } } })) ?? [])
        ]
      };
    }

    const updated = (await this.prisma.commissionRule.update({
      where: { id },
      data,
      include: this.scopeInclude()
    })) as unknown as RuleWithScopes;
    return this.serializeRule(updated, this.deriveStatus(updated));
  }

  async setActive(id: string, active: boolean) {
    const updated = (await this.prisma.commissionRule.update({
      where: { id },
      data: { isActive: active },
      include: this.scopeInclude()
    })) as unknown as RuleWithScopes;
    return this.serializeRule(updated, this.deriveStatus(updated));
  }

  private scopeInclude(): Prisma.CommissionRuleInclude {
    return {
      scopes: {
        include: {
          product: {
            select: { id: true, name: true }
          },
          category: {
            select: { id: true, name: true }
          },
          affiliate: {
            select: { id: true, displayName: true, defaultReferralCode: true }
          }
        }
      }
    };
  }

  private deriveStatus(rule: CommissionRule): 'active' | 'scheduled' | 'expired' | 'inactive' {
    if (!rule.isActive) {
      return 'inactive';
    }
    const now = new Date();
    if (rule.startsAt && rule.startsAt > now) {
      return 'scheduled';
    }
    if (rule.endsAt && rule.endsAt < now) {
      return 'expired';
    }
    return 'active';
  }

  private serializeRule(
    rule: CommissionRule & {
      scopes: Array<{
        product: { id: string; name: string } | null;
        category: { id: string; name: string } | null;
        affiliate: { id: string; displayName: string | null; defaultReferralCode: string } | null;
        country: string | null;
      }>;
    },
    status: 'active' | 'scheduled' | 'expired' | 'inactive'
  ) {
    return {
      id: rule.id,
      name: rule.name,
      rateType: rule.type,
      rateValue: Number(rule.rate),
      excludeTaxShipping: rule.excludeTaxShipping,
      startsAt: rule.startsAt,
      endsAt: rule.endsAt,
      status,
      conditions: rule.conditions,
      appliesTo: {
        categoryIds: rule.scopes.filter((s) => s.category).map((s) => s.category!.id),
        productIds: rule.scopes.filter((s) => s.product).map((s) => s.product!.id)
      }
    };
  }
}
