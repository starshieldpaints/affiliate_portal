// Lightweight in-memory mock data to unblock admin UI without a live backend.

const now = new Date();

function addDays(base: Date, days: number) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export const mockAffiliates = Array.from({ length: 12 }).map((_, idx) => {
  const createdAt = addDays(now, -idx).toISOString();
  const statuses = ['active', 'pending', 'blocked'] as const;
  const kycStatuses = ['verified', 'pending', 'in_review', 'rejected'] as const;
  return {
    id: `aff_${idx + 1}`,
    email: `affiliate${idx + 1}@example.com`,
    displayName: `Affiliate ${idx + 1}`,
    status: statuses[idx % statuses.length],
    kycStatus: kycStatuses[idx % kycStatuses.length],
    phone: '+911234567890',
    country: 'IN',
    payoutMethod: idx % 2 === 0 ? 'upi' : 'bank_transfer',
    payoutDetails: idx % 2 === 0 ? { upiId: 'name@bank' } : { bank: 'HDFC', account: 'XXXX' },
    createdAt,
    updatedAt: createdAt
  };
});

export const mockProducts = Array.from({ length: 10 }).map((_, idx) => {
  const createdAt = addDays(now, -idx).toISOString();
  return {
    id: `prod_${idx + 1}`,
    name: `Shield Paint ${idx + 1}L`,
    sku: `SL-${idx + 1}L`,
    price: 1499 + idx * 50,
    currency: 'INR',
    categoryId: 'cat_paint',
    categoryName: 'Paints',
    status: idx % 3 === 0 ? 'inactive' : 'active',
    imageUrl: null as string | null,
    description: 'High quality exterior paint.',
    createdAt,
    updatedAt: createdAt
  };
});

export const mockCommissionRules = Array.from({ length: 6 }).map((_, idx) => {
  const createdAt = addDays(now, -idx).toISOString();
  return {
    id: `rule_${idx + 1}`,
    name: `Rule ${idx + 1}`,
    status: idx % 2 === 0 ? 'active' : 'inactive',
    rateType: 'percent',
    rateValue: 8 + idx,
    appliesTo: { categoryIds: ['cat_paint'], productIds: [] },
    startsAt: createdAt,
    endsAt: null,
    createdAt
  };
});

export const mockOrders = Array.from({ length: 8 }).map((_, idx) => {
  const createdAt = addDays(now, -idx).toISOString();
  const statuses = ['paid', 'pending', 'refunded', 'flagged'] as const;
  return {
    id: `ord_${idx + 1}`,
    orderNumber: `SO-${1000 + idx}`,
    affiliateId: `aff_${idx + 1}`,
    productId: `prod_${idx + 1}`,
    amount: 2599 + idx * 100,
    currency: 'INR',
    status: statuses[idx % statuses.length],
    attribution: { ruleId: `rule_${(idx % 3) + 1}`, manualOverride: idx % 3 === 0 },
    createdAt
  };
});

export const mockPayouts = Array.from({ length: 6 }).map((_, idx) => {
  const createdAt = addDays(now, -idx).toISOString();
  const statuses = ['queued', 'processing', 'paid', 'failed'] as const;
  return {
    id: `pay_${idx + 1}`,
    batchId: `batch_2024_05_${26 + idx}`,
    affiliateId: `aff_${idx + 1}`,
    amount: 9000 + idx * 500,
    currency: 'INR',
    status: statuses[idx % statuses.length],
    scheduledFor: addDays(now, idx + 1).toISOString(),
    createdAt
  };
});

export const mockReports = [
  { id: 'rpt_1', type: 'payouts', label: 'Payouts last 30d', generatedAt: addDays(now, -1).toISOString(), url: '#' },
  { id: 'rpt_2', type: 'orders', label: 'Orders last 7d', generatedAt: addDays(now, -2).toISOString(), url: '#' },
  { id: 'rpt_3', type: 'summary', label: 'Executive summary 90d', generatedAt: addDays(now, -3).toISOString(), url: '#' }
];

export const mockAlerts = Array.from({ length: 5 }).map((_, idx) => {
  const createdAt = addDays(now, -idx).toISOString();
  const statuses = ['open', 'closed'] as const;
  return {
    id: `alert_${idx + 1}`,
    type: idx % 2 === 0 ? 'velocity' : 'self-purchase',
    subjectId: `aff_${idx + 1}`,
    riskScore: 0.6 + idx * 0.05,
    status: statuses[idx % statuses.length],
    createdAt
  };
});

export const mockAudit = Array.from({ length: 6 }).map((_, idx) => {
  const createdAt = addDays(now, -idx).toISOString();
  return {
    id: `audit_${idx + 1}`,
    actor: `admin${idx + 1}@example.com`,
    action: idx % 2 === 0 ? 'UPDATED_COMMISSION_RULE' : 'APPROVED_KYC',
    targetId: idx % 2 === 0 ? `rule_${idx + 1}` : `aff_${idx + 1}`,
    createdAt,
    meta: { ip: '1.1.1.1' }
  };
});

export function listMockAffiliates(filters?: {
  search?: string;
  status?: string;
  kycStatus?: string;
}) {
  let data = [...mockAffiliates];
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (a) => a.email.toLowerCase().includes(q) || a.displayName.toLowerCase().includes(q)
    );
  }
  if (filters?.status && filters.status !== 'all') {
    data = data.filter((a) => a.status === filters.status);
  }
  if (filters?.kycStatus && filters.kycStatus !== 'all') {
    data = data.filter((a) => a.kycStatus === filters.kycStatus);
  }
  return { data, meta: { page: 1, pageSize: data.length, total: data.length } };
}

export function listMockProducts(filters?: { search?: string; status?: string }) {
  let data = [...mockProducts];
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
    );
  }
  if (filters?.status && filters.status !== 'all') {
    data = data.filter((p) => p.status === filters.status);
  }
  return { data, meta: { page: 1, pageSize: data.length, total: data.length } };
}

export function listMockCommissionRules(filters?: { search?: string; status?: string }) {
  let data = [...mockCommissionRules];
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    data = data.filter((r) => r.name.toLowerCase().includes(q));
  }
  if (filters?.status && filters.status !== 'all') {
    data = data.filter((r) => r.status === filters.status);
  }
  return { data, meta: { page: 1, pageSize: data.length, total: data.length } };
}

export function listMockOrders(filters?: { search?: string; status?: string }) {
  let data = [...mockOrders];
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    data = data.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
  }
  if (filters?.status && filters.status !== 'all') {
    data = data.filter((o) => o.status === filters.status);
  }
  return { data, meta: { page: 1, pageSize: data.length, total: data.length } };
}

export function listMockPayouts(filters?: { status?: string }) {
  let data = [...mockPayouts];
  if (filters?.status && filters.status !== 'all') {
    data = data.filter((p) => p.status === filters.status);
  }
  return { data, meta: { page: 1, pageSize: data.length, total: data.length } };
}

export function listMockReports(filters?: { type?: string }) {
  let data = [...mockReports];
  if (filters?.type && filters.type !== 'all') {
    data = data.filter((r) => r.type === filters.type);
  }
  return { data, meta: { page: 1, pageSize: data.length, total: data.length } };
}

export function listMockAlerts(filters?: { status?: string }) {
  let data = [...mockAlerts];
  if (filters?.status && filters.status !== 'all') {
    data = data.filter((a) => a.status === filters.status);
  }
  return { data, meta: { page: 1, pageSize: data.length, total: data.length } };
}

export function listMockAudit(filters?: { actorEmail?: string }) {
  let data = [...mockAudit];
  if (filters?.actorEmail) {
    const q = filters.actorEmail.toLowerCase();
    data = data.filter((a) => a.actor.toLowerCase().includes(q));
  }
  return { data, meta: { page: 1, pageSize: data.length, total: data.length } };
}
