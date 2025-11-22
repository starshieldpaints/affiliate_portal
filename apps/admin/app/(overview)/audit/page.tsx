"use client";

import { useEffect, useState } from "react";
import { listMockAudit } from "../../../src/lib/mock-admin-service";
import { EmptyState, LoadingRow, PageHeader, SearchInput, TableShell } from "../../../src/lib/ui";

type AuditRow = {
  id: string;
  actor: string;
  action: string;
  targetId: string;
  createdAt: string;
};

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const res = listMockAudit({ actorEmail: search || undefined });
      setRows(
        res.data.map((item) => ({
          id: item.id,
          actor: item.actor,
          action: item.action,
          targetId: item.targetId,
          createdAt: item.createdAt
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Center"
        eyebrow="Compliance"
        description="Immutable audit events across admin actions."
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Filter by actor email"
            value={search}
            onChange={setSearch}
          />
          <span className="text-xs text-muted">{rows.length} entries</span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <TableShell headers={["Action", "Actor", "Target", "Created"]}>
          {loading ? (
            <LoadingRow label="Loading audit logs..." />
          ) : rows.length === 0 ? (
            <EmptyState title="No audit entries found." />
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{row.action}</span>
                  <span className="text-xs text-muted">{row.id}</span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-200">{row.actor}</div>
                <div className="text-xs text-slate-700 dark:text-slate-200">{row.targetId}</div>
                <div className="text-xs text-muted">{new Date(row.createdAt).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </TableShell>
      </div>
    </div>
  );
}
