"use client";

import { useEffect, useMemo, useState } from "react";
import { listMockAudit } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { FileText, ShieldCheck } from "lucide-react";
import { cn } from "../../../src/utils/cn";

type AuditRow = {
  id: string;
  actor: string;
  action: string;
  targetId: string;
  createdAt: string;
  meta?: Record<string, unknown>;
};

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: "", action: "all" });
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const updates = rows.filter((r) => r.action?.toLowerCase().includes("update")).length;
    const approvals = rows.filter((r) => r.action?.toLowerCase().includes("approve")).length;
    return { total, updates, approvals };
  }, [rows]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const res = listMockAudit({ actorEmail: filters.search || undefined });
      let data = res.data.map((item) => ({
        id: item.id,
        actor: item.actor,
        action: item.action,
        targetId: item.targetId,
        createdAt: item.createdAt,
        meta: item.meta
      }));
      if (filters.action !== "all") {
        data = data.filter((r) => r.action.toLowerCase().includes(filters.action));
      }
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Center"
        eyebrow="Compliance"
        description="Immutable audit events across admin actions."
        actions={
          <div className="flex flex-wrap gap-2 text-sm">
            <FilterPill
              label="Action"
              value={filters.action}
              onChange={(value) => setFilters((f) => ({ ...f, action: value }))}
              options={[
                { value: "all", label: "All" },
                { value: "update", label: "Updates" },
                { value: "approve", label: "Approvals" }
              ]}
            />
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total entries" value={stats.total.toString()} />
        <StatCard label="Updates" value={stats.updates.toString()} tone="info" />
        <StatCard label="Approvals" value={stats.approvals.toString()} tone="success" />
      </div>

      <div className="flex max-h-[70vh] flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Filter by actor email"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
          <span className="text-xs text-muted">{rows.length} entries</span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto pb-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading audit logs..." />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No audit entries found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Action</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.action}</h3>
                      <p className="text-xs text-muted">{row.id}</p>
                    </div>
                    <Badge tone="info">Audit</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Info label="Actor" value={row.actor} />
                    <Info label="Target" value={row.targetId ?? "—"} />
                    <Info label="Created" value={new Date(row.createdAt).toLocaleString()} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs">
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
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Audit</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {selected.action}
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
              <Info label="Actor" value={selected.actor} />
              <Info label="Target" value={selected.targetId ?? "—"} />
              <Info label="Created" value={new Date(selected.createdAt).toLocaleString()} />
            </div>
            {selected.meta && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Meta</p>
                <pre className="overflow-x-auto text-xs text-slate-700 dark:text-slate-200">{JSON.stringify(selected.meta, null, 2)}</pre>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                onClick={() => setSelected(null)}
              >
                <ShieldCheck className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "info" | "success" }) {
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
