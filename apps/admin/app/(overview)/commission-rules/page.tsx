"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../src/lib/api-client";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { Plus, Pencil, ToggleLeft, ToggleRight, Save, X } from "lucide-react";
import { cn } from "../../../src/utils/cn";

type RuleRow = {
  id: string;
  name: string;
  status: "active" | "inactive" | "scheduled" | "expired";
  type: string;
  rate: number;
  startsAt?: string | null;
  endsAt?: string | null;
  excludeTaxShipping?: boolean;
  scopes?: string[];
};

export default function CommissionRulesPage() {
  const [rows, setRows] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const [editing, setEditing] = useState<Partial<RuleRow> | null>(null);
  const [metaCounts, setMetaCounts] = useState<Record<string, number>>({});

  const mapRule = (r: any): RuleRow => ({
    id: r.id,
    name: r.name,
    status: r.status ?? (r.isActive ? "active" : "inactive"),
    type: r.rateType ?? r.type ?? "percent",
    rate: Number(r.rateValue ?? r.rate ?? 0),
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    excludeTaxShipping: r.excludeTaxShipping,
    scopes: Array.isArray(r.scopes)
      ? r.scopes.map((s: any) => s.label ?? s.type ?? "scope")
      : Array.isArray(r.appliesTo?.categoryIds) || Array.isArray(r.appliesTo?.productIds)
        ? [
            ...(r.appliesTo?.categoryIds ?? []).map((id: string) => `Category ${id}`),
            ...(r.appliesTo?.productIds ?? []).map((id: string) => `Product ${id}`)
          ]
        : []
  });

  useEffect(() => {
    load();
  }, [filters]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listCommissionRules({
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined
      });
      setRows(res.data.map(mapRule));
      setMetaCounts(res.meta?.statusCounts ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load rules");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = rows.length;
    return {
      total,
      active: metaCounts.active ?? rows.filter((r) => r.status === "active").length,
      inactive: metaCounts.inactive ?? rows.filter((r) => r.status === "inactive").length,
      scheduled: metaCounts.scheduled ?? rows.filter((r) => r.status === "scheduled").length,
      expired: metaCounts.expired ?? rows.filter((r) => r.status === "expired").length
    };
  }, [rows, metaCounts]);

  const handleSave = async () => {
    if (!isValid(editing)) return;
    setLoading(true);
    try {
      if (editing?.id) {
        const updated = await adminApi.updateCommissionRule(editing.id, {
          name: editing.name!,
          rateType: editing.type!,
          rateValue: editing.rate!,
          excludeTaxShipping: editing.excludeTaxShipping ?? false,
          startsAt: editing.startsAt ?? null,
          endsAt: editing.endsAt ?? null
        } as any);
        setRows((prev) => prev.map((r) => (r.id === editing.id ? mapRule(updated) : r)));
      } else {
        const created = await adminApi.createCommissionRule({
          name: editing?.name ?? "New rule",
          rateType: editing?.type ?? "percent",
          rateValue: editing?.rate ?? 0,
          excludeTaxShipping: editing?.excludeTaxShipping ?? false,
          startsAt: editing?.startsAt ?? null,
          endsAt: editing?.endsAt ?? null
        } as any);
        setRows((prev) => [mapRule(created), ...prev]);
      }
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save rule");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (row: RuleRow) => {
    setLoading(true);
    try {
      if (row.status === "active") {
        await adminApi.deactivateCommissionRule(row.id);
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "inactive" } : r)));
      } else {
        await adminApi.activateCommissionRule(row.id);
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "active" } : r)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status");
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      const statusMatch = filters.status === "all" || r.status === filters.status;
      const textMatch = !term || r.name.toLowerCase().includes(term) || r.type.toLowerCase().includes(term);
      return statusMatch && textMatch;
    });
  }, [rows, filters]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Commission Rules"
        eyebrow="Payout Engine"
        description="Manage commission policies across products, categories, and affiliates."
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            onClick={() =>
              setEditing({
                name: "",
                status: "active",
                type: "percent",
                rate: 0,
                excludeTaxShipping: true,
                startsAt: null,
                endsAt: null
              })
            }
          >
            <Plus className="h-4 w-4" /> New rule
          </button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total.toString()} />
        <StatCard label="Active" value={stats.active.toString()} tone="success" />
        <StatCard label="Scheduled" value={stats.scheduled.toString()} tone="info" />
        <StatCard label="Inactive / Expired" value={(stats.inactive + stats.expired).toString()} tone="muted" />
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "scheduled", label: "Scheduled" },
                { value: "expired", label: "Expired" }
              ]}
            />
          </div>
          <SearchInput
            placeholder="Search by rule name"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
        </div>

        {error && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="mt-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading rules..." />
            </div>
          ) : filteredRows.length === 0 ? (
            <EmptyState title="No rules found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredRows.map((row) => (
                <article
                  key={row.id}
                  className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Rule</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.name}</h3>
                      <p className="text-xs text-muted">{row.id}</p>
                    </div>
                    <Badge tone={row.status === "active" ? "success" : row.status === "scheduled" ? "info" : "muted"}>
                      {row.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <Info label="Rate" value={row.type === "percent" ? `${row.rate}%` : row.rate.toString()} />
                    <Info label="Starts" value={row.startsAt ? new Date(row.startsAt).toLocaleDateString() : "Not set"} />
                    <Info label="Ends" value={row.endsAt ? new Date(row.endsAt).toLocaleDateString() : "Not set"} />
                    <Info label="Scopes" value={(row.scopes?.length ?? 0).toString()} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-xs">
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                      onClick={() => setEditing(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                      onClick={() => toggleStatus(row)}
                    >
                      {row.status === "active" ? (
                        <>
                          <ToggleLeft className="h-3.5 w-3.5" /> Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="h-3.5 w-3.5" /> Activate
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Commission Rule</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {editing.id ? "Edit rule" : "New rule"}
                </h3>
              </div>
              <button className="text-sm font-semibold text-brand hover:underline" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Name" required>
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...(p ?? {}), name: e.target.value }))}
                />
              </Field>
              <Field label="Type" required>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={editing.type ?? "percent"}
                  onChange={(e) => setEditing((p) => ({ ...(p ?? {}), type: e.target.value }))}
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
              </Field>
              <Field label="Rate" required>
                <input
                  type="number"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={editing.rate ?? 0}
                  onChange={(e) => setEditing((p) => ({ ...(p ?? {}), rate: Number(e.target.value) || 0 }))}
                />
              </Field>
              <Field label="Exclude tax & shipping">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.excludeTaxShipping ?? false}
                    onChange={(e) => setEditing((p) => ({ ...(p ?? {}), excludeTaxShipping: e.target.checked }))}
                  />
                  <span className="text-sm text-muted">Do not pay on tax/shipping</span>
                </div>
              </Field>
              <Field label="Starts at">
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={editing.startsAt ? editing.startsAt.slice(0, 10) : ""}
                  onChange={(e) => setEditing((p) => ({ ...(p ?? {}), startsAt: e.target.value || null }))}
                />
              </Field>
              <Field label="Ends at">
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={editing.endsAt ? editing.endsAt.slice(0, 10) : ""}
                  onChange={(e) => setEditing((p) => ({ ...(p ?? {}), endsAt: e.target.value || null }))}
                />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
                onClick={() => setEditing(null)}
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                onClick={handleSave}
                disabled={!isValid(editing) || loading}
              >
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
      <span className="font-semibold">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      {children}
    </label>
  );
}

function isValid(rule: Partial<RuleRow> | null) {
  if (!rule) return false;
  return Boolean(rule.name && rule.type && typeof rule.rate === "number");
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "info" | "muted" }) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : tone === "info"
        ? "bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
        : tone === "muted"
          ? "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
          : "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold rounded-xl px-3 py-2", toneClasses)}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
