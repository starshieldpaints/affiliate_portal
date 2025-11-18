export type AffiliateDashboardOverview = {
  stats: {
    clicks: number;
    conversions: number;
    totalCommission: number;
    pendingCommission: number;
    activeLinks: number;
  };
  upcomingPayout: {
    amount: number;
    currency: string;
    scheduledFor: string;
  } | null;
  topLinks: Array<{
    id: string;
    label: string;
    clicks: number;
    landingUrl?: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    label: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  channelMix: Array<{
    label: string;
    share: number;
  }>;
};

export type AffiliateNotification = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: 'success' | 'info' | 'warning';
};

export type AffiliatePayoutOverview = {
  summary: {
    pendingCommission: number;
    approvedCommission: number;
  };
  nextPayout: {
    amount: number;
    currency: string;
    status: string;
    scheduledFor: string;
  } | null;
  history: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string | null;
    createdAt: string;
  }>;
};

export type AffiliateReportsOverview = {
  cohorts: Array<{
    label: string;
    clicks: number;
    conversions: number;
    commission: number;
  }>;
  funnel: {
    sessions: number;
    qualified: number;
    conversions: number;
  };
};
