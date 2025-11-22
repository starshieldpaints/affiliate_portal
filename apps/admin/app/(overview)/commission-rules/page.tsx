"use client";

import { useEffect, useState } from "react";
import { listMockCommissionRules } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput, TableShell } from "../../../src/lib/ui";

type RuleRow = {
  id: string;
  name: string;
  status: string;
  rateType: string;
  rateValue: number;
  startsAt: string | null;
};

export default function CommissionRulesPage() {
  const [rows, setRows] = useState<RuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "" });

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
          startsAt: item.startsAt
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load rules");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Commission Rules"
        eyebrow="Payout Engine"
        description="Manage and schedule commission policies across products and categories."
        actions={
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
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
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

        <TableShell headers={["Rule", "Status", "Rate", "Starts"]}>
          {loading ? (
            <LoadingRow label="Loading rules..." />
          ) : rows.length === 0 ? (
            <EmptyState title="No rules found." />
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>
                  <span className="text-xs text-muted">{row.id}</span>
                </div>
                <Badge tone={row.status === "active" ? "success" : "muted"}>{row.status}</Badge>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  {row.rateType === "percent" ? `${row.rateValue}%` : row.rateValue}
                </div>
                <div className="text-xs text-muted">
                  {row.startsAt ? new Date(row.startsAt).toLocaleDateString() : "—"}
                </div>
              </div>
            ))
          )}
        </TableShell>
      </div>
    </div>
  );
}
