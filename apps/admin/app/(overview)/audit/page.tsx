"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../src/lib/api-client";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { Download, FileText } from "lucide-react";
import type { AdminAuditLog } from "../../../src/types/audit";

export default function AuditPage() {
  const [rows, setRows] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: "", action: "all" });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total?: number; page?: number; pageSize?: number }>({});
  const [selected, setSelected] = useState<AdminAuditLog | null>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const updates = rows.filter((r) => r.action?.toLowerCase().includes("update")).length;
    const approvals = rows.filter((r) => r.action?.toLowerCase().includes("approve")).length;
    return { total, updates, approvals };
  }, [rows]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listAuditLogs({
        search: filters.search || undefined,
        action: filters.action !== "all" ? filters.action : undefined,
        page
      });
      setRows(res.data);
      setMeta(res.meta ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const filteredRows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchAction = filters.action === "all" || row.action.toLowerCase().includes(filters.action);
      const matchSearch =
        !term ||
        (row.performedBy ?? "").toLowerCase().includes(term) ||
        (row.entityId ?? "").toLowerCase().includes(term) ||
        row.action.toLowerCase().includes(term);
      return matchAction && matchSearch;
    });
  }, [rows, filters]);

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
              onChange={(value) => {
                setPage(1);
                setFilters((f) => ({ ...f, action: value }));
              }}
              options={[
                { value: "all", label: "All" },
                { value: "update", label: "Updates" },
                { value: "approve", label: "Approvals" }
              ]}
            />
            <a
              href={adminApi.exportAuditCsv()}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              <Download className="h-4 w-4" /> Export CSV
            </a>
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
            placeholder="Search by user, action, or entity"
            value={filters.search}
            onChange={(next) => {
              setPage(1);
              setFilters((f) => ({ ...f, search: next }));
            }}
          />
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>
              Page {meta.page ?? 1} / {meta.total && meta.pageSize ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1}
            </span>
          </div>
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
          ) : filteredRows.length === 0 ? (
            <EmptyState title="No audit entries found." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Audit</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.action}</h3>
                      <p className="text-xs text-muted">{row.id}</p>
                    </div>
                    <Badge tone="info">{row.entityType ?? "event"}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Info label="User" value={row.performedBy ?? "system"} />
                    <Info label="Entity" value={row.entityId ?? "n/a"} />
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

        {filteredRows.length > 0 && meta.page && meta.pageSize && meta.total ? (
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
              disabled={page >= Math.ceil(meta.total / meta.pageSize)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Audit</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{selected.action}</h3>
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
              <Info label="User" value={selected.performedBy ?? "system"} />
              <Info label="Entity" value={`${selected.entityType ?? "n/a"} • ${selected.entityId ?? ""}`} />
              <Info label="Created" value={new Date(selected.createdAt).toLocaleString()} />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Metadata</p>
              <pre className="mt-2 overflow-auto rounded-xl bg-slate-900/80 p-3 text-xs text-white">
                {JSON.stringify(selected.meta ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "info" | "muted" | "success" }) {
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
