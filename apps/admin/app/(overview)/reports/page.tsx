"use client";

import { useEffect, useMemo, useState } from "react";
import { listMockReports } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { Download, FileText, RefreshCcw } from "lucide-react";
import { cn } from "../../../src/utils/cn";

type ReportRow = {
  id: string;
  type: string;
  label: string;
  generatedAt: string;
  url?: string | null;
};

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ type: "all", search: "" });
  const [selected, setSelected] = useState<ReportRow | null>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const payouts = rows.filter((r) => r.type === "payouts").length;
    const orders = rows.filter((r) => r.type === "orders").length;
    return { total, payouts, orders };
  }, [rows]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const res = listMockReports({
        type: filters.type !== "all" ? filters.type : undefined
      });
      setRows(
        res.data.map((item) => ({
          id: item.id,
          type: item.type,
          label: item.label,
          generatedAt: item.generatedAt,
          url: item.url
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, [filters.type]);

  const filteredRows = rows.filter(
    (r) =>
      filters.type === "all" || r.type === filters.type
  ).filter((r) => r.label.toLowerCase().includes(filters.search.toLowerCase()) || r.id.toLowerCase().includes(filters.search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        eyebrow="Exports"
        description="Access and request operational and performance reports."
        actions={
          <div className="flex flex-wrap gap-2 text-sm">
            <FilterPill
              label="Type"
              value={filters.type}
              onChange={(value) => setFilters((f) => ({ ...f, type: value }))}
              options={[
                { value: "all", label: "All" },
                { value: "payouts", label: "Payouts" },
                { value: "orders", label: "Orders" },
                { value: "summary", label: "Summary" }
              ]}
            />
            <button
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              onClick={() =>
                setSelected({
                  id: "new",
                  type: "orders",
                  label: "New report",
                  generatedAt: new Date().toISOString(),
                  url: null
                })
              }
            >
              <RefreshCcw className="h-4 w-4" /> Generate
            </button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total reports" value={stats.total.toString()} />
        <StatCard label="Payouts" value={stats.payouts.toString()} tone="info" />
        <StatCard label="Orders" value={stats.orders.toString()} tone="muted" />
      </div>

      <div className="flex max-h-[70vh] flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by report name or ID"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
          <span className="text-xs text-muted">{filteredRows.length} reports</span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto pb-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading reports..." />
            </div>
          ) : filteredRows.length === 0 ? (
            <EmptyState title="No reports found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredRows.map((row) => (
                <article
                  key={row.id}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Report</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.label}</h3>
                      <p className="text-xs text-muted">{row.id}</p>
                    </div>
                    <Badge tone="info">{row.type}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Info label="Generated" value={new Date(row.generatedAt).toLocaleString()} />
                    <Info label="Link" value={row.url ? "Available" : "Processing"} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs">
                    {row.url ? (
                      <a
                        href={row.url}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    ) : (
                      <span className="text-muted text-xs">Not ready</span>
                    )}
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                      onClick={() => setSelected(row)}
                    >
                      <FileText className="h-3.5 w-3.5" /> Details
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
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Report</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {selected.label}
                </h3>
                <p className="text-sm text-muted">{selected.id}</p>
              </div>
              <button
                className="text-sm font-semibold text-brand hover:underline"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Type" value={selected.type} />
              <Info label="Generated" value={new Date(selected.generatedAt).toLocaleString()} />
              <Info label="Link" value={selected.url ? selected.url : "Processing"} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "info" | "muted" }) {
  const toneClasses =
    tone === "info"
      ? "bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
      : tone === "muted"
      ? "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
      : "bg-white text-slate-900 dark:bg-slate-900/40 dark:text-slate-100";
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
