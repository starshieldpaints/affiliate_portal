"use client";

import { useEffect, useState } from "react";
import { listMockOrders } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput, TableShell } from "../../../src/lib/ui";

type OrderRow = {
  id: string;
  orderNumber: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: string;
  manualOverride: boolean;
  createdAt: string;
};

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "" });

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const res = listMockOrders({
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined
      });
      setRows(
        res.data.map((item) => ({
          id: item.id,
          orderNumber: item.orderNumber,
          affiliateId: item.affiliateId,
          amount: item.amount,
          currency: item.currency,
          status: item.status,
          manualOverride: item.attribution?.manualOverride ?? false,
          createdAt: item.createdAt
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders & Refunds"
        eyebrow="Commerce"
        description="Review attributed orders, overrides, and refunds."
        actions={
          <FilterPill
            label="Status"
            value={filters.status}
            onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
            options={[
              { value: "all", label: "All" },
              { value: "paid", label: "Paid" },
              { value: "pending", label: "Pending" },
              { value: "refunded", label: "Refunded" },
              { value: "flagged", label: "Flagged" }
            ]}
          />
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by order ID or number"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
          <span className="text-xs text-muted">{rows.length} orders</span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <TableShell headers={["Order", "Status", "Amount", "Override", "Created"]}>
          {loading ? (
            <LoadingRow label="Loading orders..." />
          ) : rows.length === 0 ? (
            <EmptyState title="No orders found." />
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{row.orderNumber}</span>
                  <span className="text-xs text-muted">Affiliate: {row.affiliateId}</span>
                </div>
                <Badge
                  tone={
                    row.status === "paid"
                      ? "success"
                      : row.status === "refunded"
                      ? "warn"
                      : row.status === "flagged"
                      ? "warn"
                      : "muted"
                  }
                >
                  {row.status}
                </Badge>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  {formatPrice(row.amount, row.currency)}
                </div>
                <Badge tone={row.manualOverride ? "info" : "muted"}>
                  {row.manualOverride ? "Manual" : "Auto"}
                </Badge>
                <div className="text-xs text-muted">{new Date(row.createdAt).toLocaleDateString()}</div>
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
