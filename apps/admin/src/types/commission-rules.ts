export type AdminCommissionRule = {
  id: string;
  name: string;
  type: string;
  rate: number;
  excludeTaxShipping: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  status: 'active' | 'scheduled' | 'expired' | 'inactive';
  scopes: Array<{
    type: 'product' | 'category' | 'affiliate' | 'country' | 'global';
    label: string;
    id: string;
  }>;
};

export type CommissionRulesListResponse = {
  data: AdminCommissionRule[];
  meta: {
    total: number;
    take: number;
    statusCounts: Record<'active' | 'scheduled' | 'expired' | 'inactive', number>;
  };
};

export type CreateCommissionRulePayload = {
  name: string;
  type?: string;
  rate?: number;
  rateType?: string;
  rateValue?: number;
  excludeTaxShipping?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  conditions?: unknown;
  scopes?: Array<{
    type: 'product' | 'category' | 'affiliate' | 'country' | 'global';
    targetId?: string;
  }>;
};
