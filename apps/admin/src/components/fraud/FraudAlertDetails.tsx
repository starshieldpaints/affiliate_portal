'use client';

type Props = {
  alert: {
    id: string;
    type: string;
    affiliateId: string;
    orderId?: string | null;
    clickId?: string | null;
    riskScore: number;
    status: string;
    notes?: string | null;
    createdAt?: Date | null;
  };
};

export function FraudAlertDetails({ alert }: Props) {
  return (
    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
      <p>
        <strong>Type:</strong> {alert.type}
      </p>
      <p>
        <strong>Affiliate:</strong> {alert.affiliateId}
      </p>
      <p>
        <strong>Order:</strong> {alert.orderId ?? '—'}
      </p>
      <p>
        <strong>Click:</strong> {alert.clickId ?? '—'}
      </p>
      <p>
        <strong>Risk score:</strong> {alert.riskScore}
      </p>
      <p>
        <strong>Status:</strong> {alert.status}
      </p>
      <p>
        <strong>Notes:</strong> {alert.notes ?? '—'}
      </p>
    </div>
  );
}
