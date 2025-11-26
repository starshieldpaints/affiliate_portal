"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../src/lib/api-client";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { ArrowLeft, DollarSign, RefreshCcw, ShieldX, ToggleLeft, ToggleRight } from "lucide-react";

type OrderRow = {
  id: string;
  orderNumber: string;
  externalId?: string | null;
  affiliateId: string | null;
  couponCode?: string | null;
  storeId?: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentStatus?: string | null;
  risk?: string | null;
  placedAt?: string | null;
  createdAt: string;
  manualOverride?: boolean;
  items?: Array<{ name: string | null; sku: string | null; quantity: number; unitPriceNet: number; lineTotalNet: number }>;
};

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "", risk: "all" });
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; pageSize: number; page: number }>({ total: 0, pageSize: 20, page: 1 });

  const stats = useMemo(() => {
    const total = rows.length;
    const paid = rows.filter((r) => r.status === "paid").length;
    const refunded = rows.filter((r) => r.status === "refunded").length;
    return { total, paid, refunded };
  }, [rows]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listOrders({
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        risk: filters.risk !== "all" ? filters.risk : undefined,
        page
      });
      setRows(
        res.data.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber ?? o.externalId ?? o.id,
          externalId: o.externalId ?? o.id,
          affiliateId: o.affiliateId ?? null,
          couponCode: o.couponCode ?? null,
          storeId: o.storeId ?? null,
          amount: Number(o.amount ?? 0),
          currency: o.currency ?? "USD",
          status: o.status ?? o.paymentStatus ?? "paid",
          paymentStatus: o.paymentStatus ?? o.status,
          risk: o.risk ?? "normal",
          placedAt: o.placedAt ?? o.createdAt,
          createdAt: o.createdAt,
          manualOverride: o.manualOverride ?? false,
          items:
            o.items?.map((i: any) => ({
              name: i.name ?? null,
              sku: i.sku ?? null,
              quantity: i.quantity ?? 1,
              unitPriceNet: Number(i.unitPriceNet ?? i.price ?? 0),
              lineTotalNet: Number(i.lineTotalNet ?? i.price ?? 0) || Number(i.unitPriceNet ?? 0) * (i.quantity ?? 1)
            })) ?? []
        }))
      );
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const updateStatus = async (row: OrderRow, next: string) => {
    setLoading(true);
    try {
      const updated = await adminApi.updateOrderStatus(row.id, next);
      const mapped = {
        id: updated.id,
        orderNumber: (updated as any).orderNumber ?? (updated as any).externalId ?? updated.id,
        externalId: (updated as any).externalId ?? updated.id,
        affiliateId: (updated as any).affiliateId ?? null,
        couponCode: (updated as any).couponCode ?? null,
        storeId: (updated as any).storeId ?? null,
        amount: Number((updated as any).amount ?? 0),
        currency: (updated as any).currency ?? "USD",
        status: (updated as any).status ?? (updated as any).paymentStatus ?? next,
        paymentStatus: (updated as any).paymentStatus ?? (updated as any).status,
        risk: (updated as any).risk ?? row.risk ?? "normal",
        placedAt: (updated as any).placedAt ?? updated.createdAt,
        createdAt: updated.createdAt,
        manualOverride: (updated as any).manualOverride ?? row.manualOverride ?? false,
        items: row.items
      };
      setRows((prev) => prev.map((r) => (r.id === row.id ? mapped : r)));
      setSelected((prev) => (prev && prev.id === row.id ? mapped : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status");
    } finally {
      setLoading(false);
    }
  };

  const issueRefund = async (row: OrderRow) => {
    if (!refundAmount.trim()) return;
    setLoading(true);
    try {
      await adminApi.refundOrder(row.id, { amount: Number(refundAmount), reason: refundReason || "Admin refund" });
      await load();
      setSelected((prev) => (prev && prev.id === row.id ? { ...prev, status: "refunded", paymentStatus: "refunded" } : prev));
      setRefundAmount("");
      setRefundReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to issue refund");
    } finally {
      setLoading(false);
    }
  };

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
              onChange={(value) => {
                setPage(1);
                setFilters((f) => ({ ...f, status: value }));
              }}
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
              onChange={(value) => {
                setPage(1);
                setFilters((f) => ({ ...f, risk: value }));
              }}
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

      <div className="flex flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by order ID or number"
            value={filters.search}
            onChange={(next) => {
              setPage(1);
              setFilters((f) => ({ ...f, search: next }));
            }}
          />
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>
              Page {meta.page} of {Math.max(1, Math.ceil((meta.total || 0) / (meta.pageSize || 20)))}
            </span>
            <button
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
              onClick={load}
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="relative">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading orders..." />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No orders found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Order</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.orderNumber}</h3>
                      <p className="text-xs text-muted">Affiliate: {row.affiliateId ?? "—"}</p>
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
                    <Info label="Payment" value={row.paymentStatus ?? row.status} />
                    <Info label="Created" value={new Date(row.createdAt).toLocaleDateString()} />
                    <Info label="ID" value={row.id} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs">
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                      onClick={() => setSelected(row)}
                    >
                      Details
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                      onClick={() => updateStatus(row, row.status === "paid" ? "flagged" : "paid")}
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

        {rows.length > 0 && (
          <div className="flex items-center justify-center gap-3 pt-2 text-sm">
            <button
              className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
              disabled={page >= Math.ceil((meta.total || 0) / (meta.pageSize || 20))}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Order</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{selected.orderNumber}</h3>
                <p className="text-sm text-muted">Affiliate: {selected.affiliateId ?? "—"}</p>
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
              <Info label="External ID" value={selected.externalId ?? "—"} />
              <Info label="Status" value={selected.status} />
              <Info label="Payment status" value={selected.paymentStatus ?? selected.status} />
              <Info label="Risk" value={selected.risk ?? "normal"} />
              <Info label="Amount" value={formatPrice(selected.amount, selected.currency)} />
              <Info label="Coupon" value={selected.couponCode ?? "None"} />
              <Info label="Store" value={selected.storeId ?? "—"} />
              <Info label="Placed" value={selected.placedAt ? new Date(selected.placedAt).toLocaleString() : "—"} />
              <Info label="Created" value={new Date(selected.createdAt).toLocaleString()} />
            </div>

            {selected.items && selected.items.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-2">Items</p>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  {selected.items.map((item, idx) => (
                    <div
                      key={`${selected.id}-item-${idx}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.name ?? "Item"}</p>
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
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Refund</p>
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
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  onClick={() => selected && issueRefund(selected)}
                  disabled={!refundAmount.trim() || loading}
                >
                  <DollarSign className="h-4 w-4" /> Refund
                </button>
              </div>
              <p className="text-xs text-muted mt-1">Refund submits to backend and marks order as refunded.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "warn" | "muted" }) {
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-white break-words">{value}</p>
    </div>
  );
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD", minimumFractionDigits: 2 }).format(
    amount || 0
  );
}
