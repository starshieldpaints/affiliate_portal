"use client";

import { useEffect, useState } from "react";
import { listMockPayouts } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, TableShell } from "../../../src/lib/ui";

type PayoutRow = {
  id: string;
  batchId: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: string;
  scheduledFor: string;
};

export default function PayoutsPage() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all" });

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const res = listMockPayouts({
        status: filters.status !== "all" ? filters.status : undefined
      });
      setRows(
        res.data.map((item) => ({
          id: item.id,
          batchId: item.batchId,
          affiliateId: item.affiliateId,
          amount: item.amount,
          currency: item.currency,
          status: item.status,
          scheduledFor: item.scheduledFor
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payouts");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payouts"
        eyebrow="Disbursements"
        description="Review payout batches and update statuses."
        actions={
          <FilterPill
            label="Status"
            value={filters.status}
            onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
            options={[
              { value: "all", label: "All" },
              { value: "queued", label: "Queued" },
              { value: "processing", label: "Processing" },
              { value: "paid", label: "Paid" },
              { value: "failed", label: "Failed" }
            ]}
          />
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <TableShell headers={["Payout", "Status", "Amount", "Batch", "Scheduled"]}>
          {loading ? (
            <LoadingRow label="Loading payouts..." />
          ) : rows.length === 0 ? (
            <EmptyState title="No payouts found." />
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{row.id}</span>
                  <span className="text-xs text-muted">Affiliate: {row.affiliateId}</span>
                </div>
                <Badge
                  tone={
                    row.status === "paid"
                      ? "success"
                      : row.status === "failed"
                      ? "warn"
                      : row.status === "processing"
                      ? "info"
                      : "muted"
                  }
                >
                  {row.status}
                </Badge>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  {formatPrice(row.amount, row.currency)}
                </div>
                <div className="text-xs text-muted">{row.batchId}</div>
                <div className="text-xs text-muted">
                  {new Date(row.scheduledFor).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </TableShell>
      </div>
    </div>
  );
}

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `$${value.toFixed(0)}`;
  }
}
