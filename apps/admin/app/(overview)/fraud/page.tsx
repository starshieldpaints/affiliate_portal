"use client";

import { useEffect, useMemo, useState } from "react";
import { listMockAlerts } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { AlertTriangle, ShieldCheck, ShieldQuestion, ShieldX, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "../../../src/utils/cn";

type AlertRow = {
  id: string;
  type: string;
  subjectId: string;
  riskScore: number;
  status: string;
  createdAt: string;
};

export default function FraudPage() {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const [selected, setSelected] = useState<AlertRow | null>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const open = rows.filter((r) => r.status === "open").length;
    const closed = total - open;
    const highRisk = rows.filter((r) => r.riskScore >= 0.7).length;
    return { total, open, closed, highRisk };
  }, [rows]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const res = listMockAlerts({
        status: filters.status !== "all" ? filters.status : undefined
      });
      setRows(
        res.data.map((item) => ({
          id: item.id,
          type: item.type,
          subjectId: item.subjectId,
          riskScore: item.riskScore,
          status: item.status,
          createdAt: item.createdAt
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load alerts");
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  const filteredRows = rows
    .filter((row) => (filters.status === "all" ? true : row.status === filters.status))
    .filter((row) => row.id.toLowerCase().includes(filters.search.toLowerCase()) || row.subjectId.toLowerCase().includes(filters.search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fraud & Alerts"
        eyebrow="Risk"
        description="Monitor fraud signals, risk scores, and alert triage."
        actions={
          <div className="flex flex-wrap gap-2 text-sm">
            <FilterPill
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
              options={[
                { value: "all", label: "All" },
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed" }
              ]}
            />
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total alerts" value={stats.total.toString()} />
        <StatCard label="Open" value={stats.open.toString()} tone="warn" />
        <StatCard label="Closed" value={stats.closed.toString()} tone="success" />
        <StatCard label="High risk (>=0.7)" value={stats.highRisk.toString()} tone="info" />
      </div>

      <div className="flex max-h-[70vh] flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by alert ID or subject"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
          <span className="text-xs text-muted">{filteredRows.length} alerts</span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto pb-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading alerts..." />
            </div>
          ) : filteredRows.length === 0 ? (
            <EmptyState title="No alerts found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredRows.map((row) => (
                <article
                  key={row.id}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Alert</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.id}</h3>
                      <p className="text-xs text-muted">Subject: {row.subjectId}</p>
                    </div>
                    <Badge tone={row.status === "open" ? "warn" : "success"}>{row.status}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Info label="Type" value={row.type} />
                    <Info label="Risk score" value={row.riskScore.toFixed(2)} />
                    <Info label="Created" value={new Date(row.createdAt).toLocaleString()} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs">
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                      onClick={() => setSelected(row)}
                    >
                      <ShieldQuestion className="h-3.5 w-3.5" /> View details
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                      onClick={() =>
                        setRows((prev) =>
                          prev.map((a) =>
                            a.id === row.id ? { ...a, status: a.status === "open" ? "closed" : "open" } : a
                          )
                        )
                      }
                    >
                      {row.status === "open" ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                      {row.status === "open" ? "Close" : "Reopen"}
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
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Alert</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {selected.id}
                </h3>
                <p className="text-sm text-muted">Subject: {selected.subjectId}</p>
              </div>
              <button
                className="text-sm font-semibold text-brand hover:underline"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <Info label="Type" value={selected.type} />
              <Info label="Risk score" value={selected.riskScore.toFixed(2)} />
              <Info label="Status" value={selected.status} />
              <Info label="Created" value={new Date(selected.createdAt).toLocaleString()} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                onClick={() =>
                  setRows((prev) =>
                    prev.map((a) => (a.id === selected.id ? { ...a, status: "closed" } : a))
                  )
                }
              >
                <ShieldCheck className="h-4 w-4" />
                Mark resolved
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800 dark:border-rose-700 dark:text-rose-200"
                onClick={() =>
                  setRows((prev) =>
                    prev.map((a) => (a.id === selected.id ? { ...a, status: "open" } : a))
                  )
                }
              >
                <ShieldX className="h-4 w-4" />
                Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "warn" | "success" | "info" }) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
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
