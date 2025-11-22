"use client";

import { useEffect, useState } from "react";
import { listMockProducts } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput, TableShell } from "../../../src/lib/ui";
import { Plus } from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  status: string;
  categoryName?: string;
};

const statusTone: Record<string, string> = {
  active: "text-emerald-700 bg-emerald-50 ring-emerald-100",
  inactive: "text-slate-600 bg-slate-100 ring-slate-200"
};

export default function ProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "" });

  useEffect(() => {
    setLoading(true);
    setError(null);
    const load = () => {
      try {
        const res = listMockProducts({
          search: filters.search || undefined,
          status: filters.status !== "all" ? filters.status : undefined
        });
        setRows(
          res.data.map((item) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            price: item.price,
            currency: item.currency,
            status: item.status,
            categoryName: item.categoryName
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalog Control"
        eyebrow="Products"
        description="Manage SKUs, pricing, and publish status for the affiliate catalog."
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
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900">
              <Plus className="h-4 w-4" />
              New product
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            placeholder="Search by name or SKU"
            value={filters.search}
            onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
          />
          <span className="text-xs text-muted">{rows.length} products</span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <TableShell headers={["Product", "Status", "Price", "Category"]}>
          {loading ? (
            <LoadingRow label="Loading products..." />
          ) : rows.length === 0 ? (
            <EmptyState title="No products found." />
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>
                  <span className="text-xs text-muted">{row.sku}</span>
                </div>
                <Badge tone={row.status === "active" ? "success" : "muted"}>{row.status}</Badge>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  {formatPrice(row.price, row.currency)}
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {row.categoryName ?? "-"}
                </div>
              </div>
            ))
          )}
        </TableShell>
      </div>
    </div>
  );
}

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `$${value.toFixed(0)}`;
  }
}
