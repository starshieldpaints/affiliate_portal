"use client";

import { useEffect, useMemo, useState } from "react";
import { listMockCommissionRules } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "../../../src/utils/cn";

type RuleRow = {
  id: string;
  name: string;
  status: string;
  rateType: string;
  rateValue: number;
  startsAt: string | null;
  appliesTo?: { categoryIds?: string[]; productIds?: string[] };
};

export default function CommissionRulesPage() {
  const [rows, setRows] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const [editing, setEditing] = useState<Partial<RuleRow> | null>(null);
  const [categoryOptions] = useState<string[]>(["Paints", "Primers", "Tools"]);
  const [productOptions] = useState<Record<string, string[]>>({
    Paints: ["Shield Paint 1L", "Shield Paint 2L", "Shield Paint 3L"],
    Primers: ["Primer A", "Primer B"],
    Tools: ["Roller Kit", "Brush Set"]
  });

  const filteredProducts = useMemo(() => {
    const selectedCats = editing?.appliesTo?.categoryIds;
    if (!selectedCats || selectedCats.length === 0 || selectedCats.includes("all")) {
      return Object.values(productOptions).flat();
    }
    return selectedCats.flatMap((cat) => productOptions[cat] || []);
  }, [editing?.appliesTo?.categoryIds, productOptions]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [rows]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const res = listMockCommissionRules({
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined
      });
      setRows(
        res.data.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          rateType: item.rateType,
          rateValue: item.rateValue,
          startsAt: item.startsAt,
          appliesTo: item.appliesTo
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load rules");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSave = () => {
    if (!isValid(editing)) return;
    if (editing?.id) {
      setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...(r as RuleRow), ...(editing as RuleRow) } : r)));
    } else {
      const next: RuleRow = {
        id: `rule_${rows.length + 1}`,
        name: editing?.name || "New Rule",
        status: editing?.status || "active",
        rateType: editing?.rateType || "percent",
        rateValue: editing?.rateValue ?? 0,
        startsAt: editing?.startsAt ?? null,
        appliesTo: editing?.appliesTo
      };
      setRows((prev) => [next, ...prev]);
    }
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Commission Rules"
        eyebrow="Payout Engine"
        description="Manage and schedule commission policies across products and categories."
        actions={
          <div className="flex flex-wrap gap-2 text-sm">
            <FilterPill
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]}
            />
            <button
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              onClick={() =>
                setEditing({
                  name: "",
                  status: "active",
                  rateType: "percent",
                  rateValue: 0,
                  startsAt: null,
                  appliesTo: { categoryIds: [], productIds: [] }
                })
              }
            >
              New rule
            </button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total rules" value={stats.total.toString()} />
        <StatCard label="Active" value={stats.active.toString()} tone="success" />
        <StatCard label="Inactive" value={stats.inactive.toString()} tone="muted" />
      </div>

      <div className="flex max-h-[70vh] flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by rule name"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
          <span className="text-xs text-muted">{rows.length} rules</span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto pb-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading rules..." />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No rules found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows
                .filter((row) => (filters.status === "all" ? true : row.status === filters.status))
                .filter((row) => row.name.toLowerCase().includes(filters.search.toLowerCase()))
                .map((row) => (
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
                      <Badge tone={row.status === "active" ? "success" : "muted"}>{row.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                      <Info label="Rate" value={row.rateType === "percent" ? `${row.rateValue}%` : row.rateValue.toString()} />
                      <Info label="Starts" value={row.startsAt ? new Date(row.startsAt).toLocaleDateString() : "Not set"} />
                      <Info label="Categories" value={(row.appliesTo?.categoryIds?.length || 0).toString()} />
                      <Info label="Products" value={(row.appliesTo?.productIds?.length || 0).toString()} />
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
                        onClick={() =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, status: r.status === "active" ? "inactive" : "active" } : r
                            )
                          )
                        }
                      >
                        {row.status === "active" ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                        {row.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-10">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">
                  {editing.id ? "Edit rule" : "New rule"}
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {editing.name || "Untitled rule"}
                </h3>
              </div>
              <button
                className="text-sm font-semibold text-brand hover:underline"
                onClick={() => setEditing(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Name" required>
                <input
                  className="form-input"
                  value={editing.name || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                />
              </Field>
              <Field label="Status" required>
                <select
                  className="form-input"
                  value={editing.status || "active"}
                  onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
              <Field label="Rate type" required>
                <select
                  className="form-input"
                  value={editing.rateType || "percent"}
                  onChange={(e) => setEditing((p) => ({ ...p, rateType: e.target.value }))}
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
              </Field>
              <Field label="Rate value" required>
                <input
                  className="form-input"
                  type="number"
                  value={editing.rateValue ?? 0}
                  onChange={(e) => setEditing((p) => ({ ...p, rateValue: Number(e.target.value) }))}
                />
              </Field>
              <Field label="Starts at">
                <input
                  className="form-input"
                  type="date"
                  value={editing.startsAt ? editing.startsAt.slice(0, 10) : ""}
                  onChange={(e) => setEditing((p) => ({ ...p, startsAt: e.target.value || null }))}
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Categories">
                <OptionGrid
                  options={categoryOptions}
                  selected={editing.appliesTo?.categoryIds ?? []}
                  onToggle={(val) => {
                    const selected = new Set(editing.appliesTo?.categoryIds ?? []);
                    selected.has(val) ? selected.delete(val) : selected.add(val);
                    setEditing((p) => ({
                      ...p,
                      appliesTo: { ...p?.appliesTo, categoryIds: Array.from(selected) }
                    }));
                  }}
                />
              </Field>
              <Field label="Products">
                <OptionGrid
                  options={filteredProducts}
                  selected={editing.appliesTo?.productIds ?? []}
                  onToggle={(val) => {
                    const selected = new Set(editing.appliesTo?.productIds ?? []);
                    selected.has(val) ? selected.delete(val) : selected.add(val);
                    setEditing((p) => ({
                      ...p,
                      appliesTo: { ...p?.appliesTo, productIds: Array.from(selected) }
                    }));
                  }}
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                onClick={handleSave}
                disabled={!isValid(editing)}
              >
                Save
              </button>
              {editing.id && (
                <button
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800 dark:border-rose-700 dark:text-rose-200"
                  onClick={() => handleDelete(editing.id!)}
                >
                  Delete
                </button>
              )}
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
  return Boolean(rule.name && rule.rateType && typeof rule.rateValue === "number");
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "success" | "muted" }) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : tone === "muted"
      ? "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
      : "bg-slate-50 text-slate-900 dark:bg-slate-900/40 dark:text-slate-100";
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
      <p className="font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function OptionGrid({
  options,
  selected,
  onToggle
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-inner dark:border-slate-800 dark:bg-slate-900/70">
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition",
                active
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              )}
              onClick={() => onToggle(opt)}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current">
                {active && <span className="h-2 w-2 rounded-full bg-current" />}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
