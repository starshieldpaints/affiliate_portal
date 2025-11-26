export type AdminPayoutLine = {
  id: string;
  batchId: string | null;
  affiliateId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type AdminPayoutBatch = {
  id: string;
  status: string;
  provider?: string | null;
  providerBatchId?: string | null;
  totalAmount?: number | null;
  currency?: string | null;
  lineCount?: number;
  createdAt: string;
  reconciledAt?: string | null;
};

export type AdminPayoutsListResponse = {
  data: AdminPayoutLine[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
