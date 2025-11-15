export type AdminAffiliate = {
  id: string;
  displayName: string | null;
  defaultReferralCode: string;
  phone?: string | null;
  kycStatus: string;
  payoutMethod: string | null;
  createdAt: string;
  user: {
    email: string;
    status: string;
    role: string;
    createdAt: string;
  };
  _count: {
    links: number;
    coupons: number;
  };
};

export type AffiliatesListResponse = {
  data: AdminAffiliate[];
  meta: {
    total: number;
    take: number;
    kycBreakdown: Record<string, number>;
  };
};
