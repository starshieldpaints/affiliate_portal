"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../src/lib/api-client";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { AlertTriangle, Check, FileText, ShieldCheck, ShieldX, RefreshCcw } from "lucide-react";
import type { AdminFraudAlert } from "../../../src/types/fraud";

export default function FraudPage() {
  const [rows, setRows] = useState<AdminFraudAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "", type: "all" });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ total: number; totalPages: number; page: number; pageSize: number }>({
    total: 0,
    totalPages: 1,
    page: 1,
    pageSize: 20
  });
  const [selected, setSelected] = useState<AdminFraudAlert | null>(null);
  const [notes, setNotes] = useState("");

  const stats = useMemo(() => {
    const total = rows.length;
    const open = rows.filter((r) => r.status === "open").length;
    const resolved = rows.filter((r) => r.status === "resolved").length;
    const high = rows.filter((r) => r.riskScore >= 0.7).length;
    return { total, open, resolved, high };
  }, [rows]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listFraudAlerts({
        status: filters.status !== "all" ? filters.status : undefined,
        type: filters.type !== "all" ? filters.type : undefined,
        page
      });
      setRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load alerts");
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
      const matchStatus = filters.status === "all" || row.status === filters.status;
      const matchType = filters.type === "all" || row.type === filters.type;
      const matchSearch =
        !term ||
        row.id.toLowerCase().includes(term) ||
        (row.affiliateId ?? "").toLowerCase().includes(term) ||
        (row.orderId ?? "").toLowerCase().includes(term);
      return matchStatus && matchType && matchSearch;
    });
  }, [rows, filters]);

  const resolve = async (id: string) => {
    setLoading(true);
    try {
      const res = await adminApi.resolveFraudAlert(id, notes || undefined);
      const updated = res.data;
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSelected((prev) => (prev && prev.id === id ? updated : prev));
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resolve alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fraud & Alerts"
        eyebrow="Risk"
        description="Monitor fraud signals, risk scores, and triage alerts."
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
                { value: "open", label: "Open" },
                { value: "resolved", label: "Resolved" }
              ]}
            />
            <FilterPill
              label="Type"
              value={filters.type}
              onChange={(value) => {
                setPage(1);
                setFilters((f) => ({ ...f, type: value }));
              }}
              options={[
                { value: "all", label: "All" },
                { value: "velocity", label: "Velocity" },
                { value: "self_purchase", label: "Self purchase" },
                { value: "asn_block", label: "ASN block" }
              ]}
            />
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total alerts" value={stats.total.toString()} />
        <StatCard label="Open" value={stats.open.toString()} tone="warn" />
        <StatCard label="Resolved" value={stats.resolved.toString()} tone="success" />
        <StatCard label="High risk (>=0.7)" value={stats.high.toString()} tone="info" />
      </div>

      <div className="flex flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by alert/affiliate/order"
            value={filters.search}
            onChange={(next) => {
              setPage(1);
              setFilters((f) => ({ ...f, search: next }));
            }}
          />
          <div className="flex items-center gap-2 text-xs text-muted">
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
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="relative">
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
                      <p className="text-xs text-muted">Affiliate: {row.affiliateId ?? "—"}</p>
                      <p className="text-xs text-muted">Order: {row.orderId ?? "—"}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge tone={row.status === "open" ? "warn" : "success"}>{row.status}</Badge>
                      <Badge tone={row.riskScore >= 0.7 ? "warn" : "muted"}>{row.riskScore.toFixed(2)}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Info label="Type" value={row.type} />
                    <Info label="Created" value={new Date(row.createdAt).toLocaleDateString()} />
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
                      onClick={() => resolve(row.id)}
                      disabled={row.status === "resolved"}
                    >
                      {row.status === "resolved" ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
                      Resolve
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {filteredRows.length > 0 && (
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Alert</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{selected.id}</h3>
                <p className="text-sm text-muted">Affiliate: {selected.affiliateId ?? "—"}</p>
                <p className="text-sm text-muted">Order: {selected.orderId ?? "—"}</p>
              </div>
              <button
                className="text-sm font-semibold text-brand hover:underline"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <Info label="Status" value={selected.status} />
              <Info label="Type" value={selected.type} />
              <Info label="Risk score" value={selected.riskScore.toFixed(2)} />
              <Info label="Created" value={new Date(selected.createdAt).toLocaleString()} />
              <Info label="Resolved at" value={selected.resolvedAt ? new Date(selected.resolvedAt).toLocaleString() : "—"} />
              <Info label="Resolved by" value={selected.resolvedBy ?? "—"} />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Resolution notes</p>
              <textarea
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                rows={3}
                placeholder="Add internal notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  onClick={() => resolve(selected.id)}
                  disabled={selected.status === "resolved" || loading}
                >
                  <Check className="h-4 w-4" /> Resolve
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
                  onClick={() => setNotes("")}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "warn" | "info" }) {
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
      <p className={`${toneClasses} mt-2 rounded-xl px-3 py-2 text-2xl font-semibold`}>{value}</p>
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
