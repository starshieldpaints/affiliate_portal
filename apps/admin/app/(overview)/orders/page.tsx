"use client";

import { useEffect, useMemo, useState } from "react";
import { listMockOrders } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { ArrowLeft, RefreshCcw, ShieldX, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

type OrderRow = {
  id: string;
  orderNumber: string;
  externalOrderId?: string | null;
  affiliateId: string;
  storeId?: string | null;
  couponCode?: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentStatus?: string;
  manualOverride: boolean;
  risk?: string;
  placedAt?: string | null;
  createdAt: string;
  items?: Array<{ name: string; sku?: string; quantity: number; unitPriceNet: number; lineTotalNet: number }>;
};

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "", risk: "all" });
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [overrideRule, setOverrideRule] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const stats = useMemo(() => {
    const total = rows.length;
    const paid = rows.filter((r) => r.status === "paid").length;
    const refunded = rows.filter((r) => r.status === "refunded").length;
    return { total, paid, refunded };
  }, [rows]);

  const applyOverride = (id: string) => {
    if (!overrideRule.trim()) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, manualOverride: true, status: "paid" } : row
      )
    );
    setSelected((prev) =>
      prev && prev.id === id ? { ...prev, manualOverride: true, status: "paid" } : prev
    );
  };

  const issueRefund = (id: string) => {
    if (!refundAmount.trim()) return;
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: "refunded" } : row)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status: "refunded" } : prev));
    setRefundAmount("");
    setRefundReason("");
  };

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
          externalOrderId: (item as any).externalOrderId ?? null,
          affiliateId: item.affiliateId,
          storeId: (item as any).storeId ?? null,
          couponCode: (item as any).couponCode ?? null,
          amount: item.amount,
          currency: item.currency,
          status: item.status,
          paymentStatus: (item as any).paymentStatus ?? item.status,
          manualOverride: item.attribution?.manualOverride ?? false,
          risk: (item as any).risk ?? "normal",
          placedAt: (item as any).placedAt ?? item.createdAt,
          createdAt: item.createdAt,
          items: (item as any).items ?? []
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
          <div className="flex flex-wrap gap-2 text-sm">
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
            <FilterPill
              label="Risk"
              value={filters.risk}
              onChange={(value) => setFilters((f) => ({ ...f, risk: value }))}
              options={[
                { value: "all", label: "All" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" }
              ]}
            />
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total orders" value={stats.total.toString()} />
        <StatCard label="Paid" value={stats.paid.toString()} tone="success" />
        <StatCard label="Refunded" value={stats.refunded.toString()} tone="warn" />
      </div>

      <div className="flex max-h-[70vh] flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
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

        <div className="relative flex-1 overflow-y-auto pb-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading orders..." />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No orders found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows
                .filter((row) => (filters.status === "all" ? true : row.status === filters.status))
                .filter((row) => (filters.risk === "all" ? true : (row.risk ?? "normal") === filters.risk))
                .filter((row) => row.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) || row.id.toLowerCase().includes(filters.search.toLowerCase()))
                .map((row) => (
                  <article
                    key={row.id}
                    className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Order</p>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.orderNumber}</h3>
                        <p className="text-xs text-muted">Affiliate: {row.affiliateId}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge tone={row.status === "paid" ? "success" : row.status === "refunded" ? "warn" : "muted"}>
                          {row.status}
                        </Badge>
                        <Badge tone={row.risk === "high" ? "warn" : "muted"}>{row.risk ?? "normal"}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                      <Info label="Amount" value={formatPrice(row.amount, row.currency)} />
                      <Info label="Override" value={row.manualOverride ? "Manual" : "Auto"} />
                      <Info label="Created" value={new Date(row.createdAt).toLocaleDateString()} />
                      <Info label="ID" value={row.id} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs">
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() => {
                          setSelected(row);
                          setOverrideRule(row.manualOverride ? (row as any).attribution?.ruleId ?? "" : "");
                        }}
                      >
                        View details
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() => {
                          setSelected(row);
                          setOverrideRule(row.manualOverride ? (row as any).attribution?.ruleId ?? "" : "");
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Manage
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, status: r.status === "paid" ? "flagged" : "paid" } : r
                            )
                          )
                        }
                      >
                        {row.status === "paid" ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                        {row.status === "paid" ? "Flag" : "Mark paid"}
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Order</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {selected.orderNumber}
                </h3>
                <p className="text-sm text-muted">Affiliate: {selected.affiliateId}</p>
              </div>
              <button
                className="flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft className="h-4 w-4" /> Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <Info label="Order ID" value={selected.id} />
              <Info label="External ID" value={selected.externalOrderId ?? "—"} />
              <Info label="Status" value={selected.status} />
              <Info label="Payment status" value={selected.paymentStatus ?? selected.status} />
              <Info label="Affiliate" value={selected.affiliateId} />
              <Info label="Risk" value={selected.risk ?? "normal"} />
              <Info label="Manual override" value={selected.manualOverride ? "Yes" : "No"} />
              <Info label="Amount" value={formatPrice(selected.amount, selected.currency)} />
              <Info label="Coupon" value={selected.couponCode ?? "None"} />
              <Info label="Store" value={selected.storeId ?? "—"} />
              <Info label="Placed" value={selected.placedAt ? new Date(selected.placedAt).toLocaleString() : "—"} />
              <Info label="Created" value={new Date(selected.createdAt).toLocaleString()} />
            </div>

            {selected.items && selected.items.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-2">
                  Items
                </p>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  {selected.items.map((item, idx) => (
                    <div key={`${selected.id}-item-${idx}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/70">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-muted">SKU: {item.sku ?? "—"}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatPrice(item.unitPriceNet, selected.currency)} x {item.quantity}
                        </p>
                        <p className="text-muted">Total: {formatPrice(item.lineTotalNet, selected.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Attribution override
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="form-input flex-1"
                  placeholder="Rule ID"
                  value={overrideRule}
                  onChange={(e) => setOverrideRule(e.target.value)}
                />
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  onClick={() => applyOverride(selected.id)}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Apply
                </button>
              </div>
              <p className="text-xs text-muted mt-1">Marking a rule sets manualOverride=true.</p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Refund
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[2fr_2fr_1fr] sm:items-center">
                <input
                  className="form-input"
                  type="number"
                  placeholder="Amount"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <input
                  className="form-input"
                  placeholder="Reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-rose-700"
                  onClick={() => issueRefund(selected.id)}
                  disabled={!refundAmount.trim()}
                >
                  <ShieldX className="h-4 w-4" />
                  Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "warn" }) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
      : "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses} rounded-xl px-3 py-2`}>{value}</p>
    </div>
  );
}
