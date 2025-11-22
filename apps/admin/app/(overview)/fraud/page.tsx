"use client";

import { useEffect, useState } from "react";
import { listMockAlerts } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, TableShell } from "../../../src/lib/ui";

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
  const [filters, setFilters] = useState({ status: "all" });

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
  }, [filters]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fraud & Alerts"
        eyebrow="Risk"
        description="Monitor fraud signals and alert triage."
        actions={
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
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <TableShell headers={["Alert", "Type", "Risk", "Status", "Created"]}>
          {loading ? (
            <LoadingRow label="Loading alerts..." />
          ) : rows.length === 0 ? (
            <EmptyState title="No alerts found." />
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{row.id}</span>
                  <span className="text-xs text-muted">Subject: {row.subjectId}</span>
                </div>
                <Badge tone="info">{row.type}</Badge>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {row.riskScore.toFixed(2)}
                </div>
                <Badge tone={row.status === "open" ? "warn" : "success"}>{row.status}</Badge>
                <div className="text-xs text-muted">{new Date(row.createdAt).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </TableShell>
      </div>
    </div>
  );
}
