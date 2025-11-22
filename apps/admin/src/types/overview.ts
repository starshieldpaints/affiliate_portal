export type OverviewResponse = {
  kpis: {
    gmv30d: number;
    attributedOrders: number;
    activeAffiliates: number;
    openAlerts: number;
  };
  activationFunnel: {
    signedUp: number;
    kycVerified: number;
    firstOrder: number;
    payoutReady: number;
  };
  payouts: {
    readyCount: number;
    readyAmount: number;
    processingCount: number;
    failedCount: number;
  };
  orders: {
    today: number;
    last7d: number;
    refundRate: number;
    manualOverrides: number;
  };
  risk: {
    highRiskAlerts: number;
    openAlerts: number;
  };
  payoutsQueue?: {
    queued: number;
    processing: number;
    failed: number;
  };
};
