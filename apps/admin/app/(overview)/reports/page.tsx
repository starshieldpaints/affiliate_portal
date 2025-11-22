"use client";

import { useEffect, useState } from "react";
import { listMockReports } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, TableShell } from "../../../src/lib/ui";

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
  const [filters, setFilters] = useState({ type: "all" });

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
  }, [filters]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        eyebrow="Exports"
        description="Access and request operational and performance reports."
        actions={
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
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <TableShell headers={["Report", "Type", "Generated", "Link"]}>
          {loading ? (
            <LoadingRow label="Loading reports..." />
          ) : rows.length === 0 ? (
            <EmptyState title="No reports found." />
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{row.label}</span>
                  <span className="text-xs text-muted">{row.id}</span>
                </div>
                <Badge tone="info">{row.type}</Badge>
                <div className="text-xs text-muted">
                  {new Date(row.generatedAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-brand">
                  {row.url ? (
                    <a href={row.url} className="hover:underline">
                      Download
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            ))
          )}
        </TableShell>
      </div>
    </div>
  );
}
