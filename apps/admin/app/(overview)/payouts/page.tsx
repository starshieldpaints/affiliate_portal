"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../src/lib/api-client";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { ArrowLeft, Check, Clock3, DollarSign, FileDown, RefreshCcw, ShieldX } from "lucide-react";
import type { AdminPayoutBatch, AdminPayoutLine } from "../../../src/types/payouts";

type LineRow = AdminPayoutLine;
type BatchRow = AdminPayoutBatch;

export default function PayoutsPage() {
  const [lines, setLines] = useState<LineRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number; page: number; pageSize: number }>({
    total: 0,
    totalPages: 1,
    page: 1,
    pageSize: 20
  });
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);

  const stats = useMemo(() => {
    const total = lines.length;
    const paid = lines.filter((l) => l.status === "paid").length;
    const processing = lines.filter((l) => l.status === "processing" || l.status === "queued").length;
    return { total, paid, processing };
  }, [lines]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [linesRes, batchesRes] = await Promise.all([
        adminApi.listPayoutLines({
          status: filters.status !== "all" ? filters.status : undefined,
          page
        }),
        adminApi.listPayoutBatches({})
      ]);
      setLines(linesRes.data);
      setMeta(linesRes.meta);
      setBatches(batchesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const filteredLines = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return lines.filter((l) => {
      const matchStatus = filters.status === "all" || l.status === filters.status;
      const matchSearch = !term || l.id.toLowerCase().includes(term) || (l.batchId ?? "").toLowerCase().includes(term);
      return matchStatus && matchSearch;
    });
  }, [lines, filters]);

  const triggerBatch = async () => {
    setLoading(true);
    try {
      await adminApi.createPayoutBatch({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create batch");
    } finally {
      setLoading(false);
    }
  };

  const processBatch = async (batchId: string) => {
    setLoading(true);
    try {
      await adminApi.processPayoutBatch(batchId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process batch");
    } finally {
      setLoading(false);
    }
  };

  const reconcileBatch = async (batchId: string) => {
    setLoading(true);
    try {
      await adminApi.reconcilePayoutBatch(batchId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reconcile batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6 px-4 pb-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Payouts"
        eyebrow="Disbursements"
        description="Review payout batches and individual lines."
        actions={
          <div className="flex w-full flex-col gap-3 text-sm sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <FilterPill
              label="Status"
              value={filters.status}
              onChange={(value) => {
                setPage(1);
                setFilters((f) => ({ ...f, status: value }));
              }}
              options={[
                { value: "all", label: "All" },
                { value: "queued", label: "Queued" },
                { value: "processing", label: "Processing" },
                { value: "paid", label: "Paid" },
                { value: "failed", label: "Failed" }
              ]}
            />
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 sm:w-auto"
              onClick={triggerBatch}
              disabled={loading}
            >
              <RefreshCcw className="h-4 w-4" /> Create batch
            </button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <StatCard label="Total payouts" value={stats.total.toString()} />
        <StatCard label="Paid" value={stats.paid.toString()} tone="success" />
        <StatCard label="Processing" value={stats.processing.toString()} tone="info" />
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by payout ID or batch"
            value={filters.search}
            onChange={(next) => {
              setPage(1);
              setFilters((f) => ({ ...f, search: next }));
            }}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>
              Page {meta.page} of {Math.max(1, meta.totalPages || Math.ceil((meta.total || 0) / (meta.pageSize || 20)))}
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
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="mt-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading payouts..." />
            </div>
          ) : filteredLines.length === 0 ? (
            <EmptyState title="No payouts found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredLines.map((row) => (
                <article
                  key={row.id}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Payout</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.id}</h3>
                      <p className="text-xs text-muted">Affiliate: {row.affiliateId}</p>
                      <p className="text-xs text-muted">Batch: {row.batchId ?? "—"}</p>
                    </div>
                    <Badge tone={row.status === "paid" ? "success" : row.status === "failed" ? "warn" : "info"}>{row.status}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Info label="Amount" value={formatPrice(row.amount, row.currency)} />
                    <Info label="Created" value={new Date(row.createdAt).toLocaleDateString()} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {filteredLines.length > 0 && (
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
              disabled={page >= (meta.totalPages || Math.ceil((meta.total || 0) / (meta.pageSize || 20)))}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Batches</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Payout batches</h3>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {batches.map((b) => (
            <article
              key={b.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Batch</p>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{b.id}</h4>
                  <p className="text-xs text-muted">Provider: {b.provider ?? "stub"}</p>
                  <p className="text-xs text-muted">Lines: {b.lineCount ?? "—"}</p>
                </div>
                <Badge tone={b.status === "paid" ? "success" : b.status === "failed" ? "warn" : "info"}>{b.status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                <Info label="Total" value={formatPrice(b.totalAmount ?? 0, b.currency ?? "USD")} />
                <Info label="Created" value={new Date(b.createdAt).toLocaleDateString()} />
                <Info label="Reconciled" value={b.reconciledAt ? new Date(b.reconciledAt).toLocaleDateString() : "Pending"} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                  onClick={() => setSelectedBatch(b)}
                >
                  Details
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                  onClick={() => processBatch(b.id)}
                >
                  <Clock3 className="h-3.5 w-3.5" /> Process
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                  onClick={() => reconcileBatch(b.id)}
                >
                  <Check className="h-3.5 w-3.5" /> Reconcile
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Batch</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{selectedBatch.id}</h3>
                <p className="text-sm text-muted">Provider: {selectedBatch.provider ?? "stub"}</p>
              </div>
              <button
                className="flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
                onClick={() => setSelectedBatch(null)}
              >
                <ArrowLeft className="h-4 w-4" /> Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <Info label="Status" value={selectedBatch.status} />
              <Info label="Provider batch ID" value={selectedBatch.providerBatchId ?? "—"} />
              <Info label="Total" value={formatPrice(selectedBatch.totalAmount ?? 0, selectedBatch.currency ?? "USD")} />
              <Info label="Created" value={new Date(selectedBatch.createdAt).toLocaleString()} />
              <Info
                label="Reconciled"
                value={selectedBatch.reconciledAt ? new Date(selectedBatch.reconciledAt).toLocaleString() : "Pending"}
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                onClick={() => processBatch(selectedBatch.id)}
              >
                Process
              </button>
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
                onClick={() => reconcileBatch(selectedBatch.id)}
              >
                Mark reconciled
              </button>
              {selectedBatch.providerBatchId && (
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
                  href={selectedBatch.providerBatchId}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileDown className="h-4 w-4" /> Receipt
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
      <p className="font-semibold text-slate-900 dark:text-white break-words">{value}</p>
    </div>
  );
}

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

