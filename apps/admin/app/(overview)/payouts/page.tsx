"use client";

import { useEffect, useMemo, useState } from "react";
import { listMockPayouts } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "../../../src/utils/cn";

type PayoutRow = {
  id: string;
  batchId: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: string;
  scheduledFor: string;
  createdAt?: string;
};

export default function PayoutsPage() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const [selected, setSelected] = useState<PayoutRow | null>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const paid = rows.filter((r) => r.status === "paid").length;
    const processing = rows.filter((r) => r.status === "processing").length;
    return { total, paid, processing };
  }, [rows]);

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
          scheduledFor: item.scheduledFor,
          createdAt: (item as any).createdAt ?? item.scheduledFor
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
          <div className="flex flex-wrap gap-2 text-sm">
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
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total payouts" value={stats.total.toString()} />
        <StatCard label="Paid" value={stats.paid.toString()} tone="success" />
        <StatCard label="Processing" value={stats.processing.toString()} tone="info" />
      </div>

      <div className="flex max-h-[70vh] flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by payout ID or batch"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
          <span className="text-xs text-muted">{rows.length} payouts</span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto pb-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading payouts..." />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No payouts found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows
                .filter((row) => (filters.status === "all" ? true : row.status === filters.status))
                .filter((row) => row.id.toLowerCase().includes(filters.search.toLowerCase()) || row.batchId.toLowerCase().includes(filters.search.toLowerCase()))
                .map((row) => (
                  <article
                    key={row.id}
                    className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Payout</p>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.id}</h3>
                        <p className="text-xs text-muted">Affiliate: {row.affiliateId}</p>
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
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                      <Info label="Batch" value={row.batchId} />
                      <Info label="Amount" value={formatPrice(row.amount, row.currency)} />
                      <Info label="Scheduled" value={new Date(row.scheduledFor).toLocaleString()} />
                      <Info label="Created" value={row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs">
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() => setSelected(row)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> View details
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                        onClick={() =>
                          setRows((prev) =>
                            prev.map((p) =>
                              p.id === row.id ? { ...p, status: p.status === "paid" ? "processing" : "paid" } : p
                            )
                          )
                        }
                      >
                        {row.status === "paid" ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                        {row.status === "paid" ? "Mark processing" : "Mark paid"}
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
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Payout</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {selected.id}
                </h3>
                <p className="text-sm text-muted">Affiliate: {selected.affiliateId}</p>
              </div>
              <button
                className="text-sm font-semibold text-brand hover:underline"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <Info label="Batch" value={selected.batchId} />
              <Info label="Status" value={selected.status} />
              <Info label="Amount" value={formatPrice(selected.amount, selected.currency)} />
              <Info label="Scheduled" value={new Date(selected.scheduledFor).toLocaleString()} />
              <Info label="Created" value={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"} />
              <Info label="Affiliate" value={selected.affiliateId} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                onClick={() =>
                  setRows((prev) =>
                    prev.map((p) => (p.id === selected.id ? { ...p, status: "paid" } : p))
                  )
                }
              >
                Mark Paid
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800 dark:border-rose-700 dark:text-rose-200"
                onClick={() =>
                  setRows((prev) =>
                    prev.map((p) => (p.id === selected.id ? { ...p, status: "failed" } : p))
                  )
                }
              >
                Mark Failed
              </button>
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

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "info" }) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : tone === "info"
      ? "bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
