export type AdminFraudAlert = {
  id: string;
  type: string;
  affiliateId?: string | null;
  orderId?: string | null;
  clickId?: string | null;
  riskScore: number;
  status: string;
  notes?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
};

export type AdminFraudAlertsListResponse = {
  data: AdminFraudAlert[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
