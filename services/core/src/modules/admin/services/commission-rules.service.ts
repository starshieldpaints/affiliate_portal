import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, CommissionRule } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommissionRuleDto, CommissionRuleScopeDto } from '../dto/commission-rule.dto';

type ListParams = {
  status?: 'all' | 'active' | 'scheduled' | 'expired' | 'inactive';
  search?: string;
  take?: number;
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
    const take = Math.min(Math.max(params.take ?? 50, 1), 200);

    const [rules, total] = await this.prisma.$transaction([
      this.prisma.commissionRule.findMany({
        where,
        include: this.scopeInclude(),
        orderBy: [{ isActive: 'desc' }, { startsAt: 'desc' }],
        take
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
        take,
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
        case 'scheduled':
          filters.push({
            isActive: true,
            startsAt: { gt: now }
          });
          break;
        case 'expired':
          filters.push({
            isActive: true,
            endsAt: { lt: now }
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
      type: input.type.trim(),
      rate: new Prisma.Decimal(input.rate),
      excludeTaxShipping: input.excludeTaxShipping ?? true,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      conditions: input.conditions ?? undefined
    };

    if (input.scopes?.length) {
      payload.scopes = {
        create: input.scopes.map((scope) => this.mapScope(scope))
      };
    }

    const created = (await this.prisma.commissionRule.create({
      data: payload,
      include: this.scopeInclude()
    })) as unknown as RuleWithScopes;

    return this.serializeRule(created, this.deriveStatus(created));
  }

  private mapScope(scope: CommissionRuleScopeDto): Prisma.CommissionRuleScopeCreateWithoutCommissionRuleInput {
    switch (scope.type) {
      case 'product':
        return { product: scope.targetId ? { connect: { id: scope.targetId } } : undefined };
      case 'category':
        return { category: scope.targetId ? { connect: { id: scope.targetId } } : undefined };
      case 'affiliate':
        return { affiliate: scope.targetId ? { connect: { id: scope.targetId } } : undefined };
      case 'country':
        return { country: scope.targetId ?? null };
      case 'global':
      default:
        return {};
    }
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
      type: rule.type,
      rate: Number(rule.rate),
      excludeTaxShipping: rule.excludeTaxShipping,
      startsAt: rule.startsAt,
      endsAt: rule.endsAt,
      isActive: rule.isActive,
      status,
      conditions: rule.conditions,
      scopes: rule.scopes.map((scope) => {
        if (scope.product) {
          return { type: 'product', label: scope.product.name, id: scope.product.id };
        }
        if (scope.category) {
          return { type: 'category', label: scope.category.name, id: scope.category.id };
        }
        if (scope.affiliate) {
          return {
            type: 'affiliate',
            label: scope.affiliate.displayName ?? scope.affiliate.defaultReferralCode,
            id: scope.affiliate.id
          };
        }
        if (scope.country) {
          return { type: 'country', label: scope.country, id: scope.country };
        }
        return { type: 'global', label: 'All inventory', id: 'global' };
      })
    };
  }
}
