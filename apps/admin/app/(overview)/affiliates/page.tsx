"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../../src/store/auth-store";
import { ArrowUpRight } from "lucide-react";
import { listMockAffiliates } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput, TableShell } from "../../../src/lib/ui";

 type AffiliateRow = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  kycStatus: string;
  country?: string | null;
  payoutMethod?: string | null;
  createdAt: string;
};

const statusTone: Record<string, string> = {
  active: "text-emerald-600 bg-emerald-50 ring-emerald-100",
  pending: "text-amber-700 bg-amber-50 ring-amber-100",
  blocked: "text-rose-700 bg-rose-50 ring-rose-100"
};

const kycTone: Record<string, string> = {
  verified: "text-emerald-700 bg-emerald-50 ring-emerald-100",
  in_review: "text-blue-700 bg-blue-50 ring-blue-100",
  pending: "text-amber-700 bg-amber-50 ring-amber-100",
  rejected: "text-rose-700 bg-rose-50 ring-rose-100"
};

export default function AffiliatesPage() {
  const tokenReady = useAuthStore((s) => Boolean(s.user));
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", kycStatus: "all", search: "" });

  useEffect(() => {
    if (!tokenReady) return;
    setLoading(true);
    setError(null);
    try {
      const res = listMockAffiliates({
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        kycStatus: filters.kycStatus !== "all" ? filters.kycStatus : undefined
      });
      setRows(
        res.data.map((item) => ({
          id: item.id,
          email: item.email,
          displayName: item.displayName,
          status: item.status,
          kycStatus: item.kycStatus,
          country: (item as any).country ?? null,
          payoutMethod: (item as any).payoutMethod ?? null,
          createdAt: item.createdAt
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load affiliates");
    } finally {
      setLoading(false);
    }
  }, [filters, tokenReady]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Directory & KYC"
        eyebrow="Affiliates"
        description="Search, filter, and review affiliate KYC and payout readiness."
        actions={
          <div className="flex flex-wrap gap-2 text-sm">
            <FilterPill
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "pending", label: "Pending" },
                { value: "blocked", label: "Blocked" }
              ]}
            />
            <FilterPill
              label="KYC"
              value={filters.kycStatus}
              onChange={(value) => setFilters((f) => ({ ...f, kycStatus: value }))}
              options={[
                { value: "all", label: "All" },
                { value: "verified", label: "Verified" },
                { value: "in_review", label: "In Review" },
                { value: "pending", label: "Pending" },
                { value: "rejected", label: "Rejected" }
              ]}
            />
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
          <span className="text-xs text-muted">{rows.length} affiliates</span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <TableShell headers={["Affiliate", "Status", "KYC", "Payout", "Created"]}>
          {loading ? (
            <LoadingRow label="Loading affiliates..." />
          ) : rows.length === 0 ? (
            <EmptyState title="No affiliates found." />
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{row.displayName}</span>
                  <span className="text-xs text-muted">{row.email}</span>
                </div>
                <Badge tone={row.status === "blocked" ? "warn" : row.status === "active" ? "success" : "muted"}>
                  {row.status}
                </Badge>
                <Badge
                  tone={
                    row.kycStatus === "verified"
                      ? "success"
                      : row.kycStatus === "rejected"
                      ? "warn"
                      : "info"
                  }
                >
                  {row.kycStatus}
                </Badge>
                <div className="text-xs uppercase tracking-wide text-slate-500">{row.payoutMethod ?? "-"}</div>
                <div className="text-xs text-muted">{new Date(row.createdAt).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </TableShell>
      </div>
    </div>
  );
}
