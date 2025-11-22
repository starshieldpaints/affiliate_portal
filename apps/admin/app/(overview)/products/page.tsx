"use client";

import { useEffect, useMemo, useState } from "react";
import { listMockProducts } from "../../../src/lib/mock-admin-service";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { ImageOff, Pencil, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import Image from "next/image";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  status: string;
  categoryName?: string;
  description?: string | null;
  imageUrl?: string | null;
};

const statusTone: Record<string, string> = {
  active: "text-emerald-700 bg-emerald-50 ring-emerald-100",
  inactive: "text-slate-600 bg-slate-100 ring-slate-200"
};

export default function ProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "", category: "all", price: "all" });
  const [editing, setEditing] = useState<Partial<ProductRow> | null>(null);

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
            categoryName: item.categoryName,
            description: item.description,
            imageUrl: item.imageUrl
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

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const inactive = rows.length - active;
    const avgPrice = rows.length ? rows.reduce((acc, r) => acc + (r.price || 0), 0) / rows.length : 0;
    return { active, inactive, avgPrice };
  }, [rows]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.categoryName && set.add(r.categoryName));
    return Array.from(set).sort();
  }, [rows]);

  const handleSave = () => {
    if (!isValid(editing)) return;
    if (editing?.id) {
      setRows((prev) => prev.map((p) => (p.id === editing.id ? { ...(p as ProductRow), ...(editing as ProductRow) } : p)));
    } else {
      const next: ProductRow = {
        id: `prod_${rows.length + 1}`,
        name: editing?.name || "New Product",
        sku: editing?.sku || "",
        price: editing?.price ?? 0,
        currency: editing?.currency || "INR",
        status: editing?.status || "active",
        categoryName: editing?.categoryName,
        description: editing?.description,
        imageUrl: editing?.imageUrl
      };
      setRows((prev) => [next, ...prev]);
    }
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setRows((prev) => prev.filter((p) => p.id !== id));
    setEditing(null);
  };

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
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              <span>Category</span>
              <select
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="appearance-none rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-inner transition focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="all">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <FilterPill
              label="Price"
              value={filters.price}
              onChange={(value) => setFilters((f) => ({ ...f, price: value }))}
              options={[
                { value: "all", label: "All" },
                { value: "lt1500", label: "< 1.5k" },
                { value: "1500-2000", label: "1.5k - 2k" },
                { value: "gt2000", label: "> 2k" }
              ]}
            />
            <button
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              onClick={() =>
                setEditing({
                  name: "",
                  sku: "",
                  price: 0,
                  currency: "INR",
                  status: "active"
                })
              }
            >
              <Plus className="h-4 w-4" />
              New product
            </button>
          </div>
        }
      />

          <div className="grid gap-3 md:grid-cols-3">
            <StatCard label="Active products" value={stats.active.toString()} />
            <StatCard label="Inactive" value={stats.inactive.toString()} tone="muted" />
            <StatCard label="Avg price" value={formatPrice(stats.avgPrice, rows[0]?.currency || "USD")} tone="info" />
          </div>

      <div className="flex max-h-[70vh] flex-col gap-3 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
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

        <div className="relative flex-1 overflow-y-auto">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <LoadingRow label="Loading products..." />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No products found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 pb-2">
              {rows
                .filter((row) => filters.category === "all" || row.categoryName === filters.category)
                .filter((row) => {
                  if (filters.price === "all") return true;
                  if (filters.price === "lt1500") return row.price < 1500;
                  if (filters.price === "1500-2000") return row.price >= 1500 && row.price <= 2000;
                  if (filters.price === "gt2000") return row.price > 2000;
                  return true;
                })
                .map((row) => (
                  <article
                    key={row.id}
                    className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-[150px] w-[150px] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                        {row.imageUrl ? (
                          <Image src={row.imageUrl} alt={row.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <ImageOff className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{row.categoryName ?? "Uncategorized"}</p>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.name}</h3>
                        <p className="text-xs text-muted">{row.sku}</p>
                      </div>
                      <Badge tone={row.status === "active" ? "success" : "muted"}>{row.status}</Badge>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                        <span>Price</span>
                        <span>{formatPrice(row.price, row.currency)}</span>
                      </div>
                      <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {row.description || "No description provided."}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-muted">
                        Status: <span className="font-semibold text-slate-900 dark:text-white">{row.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                          onClick={() => setEditing(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                          onClick={() =>
                            setRows((prev) =>
                              prev.map((p) =>
                                p.id === row.id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p
                              )
                            )
                          }
                        >
                          {row.status === "active" ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                          {row.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-12">
          <div className="w-full max-w-4xl translate-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">
                  {editing.id ? "Edit product" : "New product"}
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {editing.name || "Untitled"}
                </h3>
                {editing.sku && <p className="text-sm text-muted">{editing.sku}</p>}
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
              <Field label="SKU" required>
                <input
                  className="form-input"
                  value={editing.sku || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
                />
              </Field>
              <Field label="Price" required>
                <input
                  className="form-input"
                  type="number"
                  value={editing.price ?? 0}
                  onChange={(e) => setEditing((p) => ({ ...p, price: Number(e.target.value) }))}
                />
              </Field>
              <Field label="Currency" required>
                <input
                  className="form-input"
                  value={editing.currency || "INR"}
                  onChange={(e) => setEditing((p) => ({ ...p, currency: e.target.value.toUpperCase() }))}
                />
              </Field>
              <Field label="Category">
                <input
                  className="form-input"
                  value={editing.categoryName || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, categoryName: e.target.value }))}
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
              <Field label="Image URL">
                <input
                  className="form-input"
                  value={editing.imageUrl || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, imageUrl: e.target.value }))}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className="form-input min-h-[120px]"
                  value={editing.description || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))}
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

function isValid(p: Partial<ProductRow> | null) {
  if (!p) return false;
  return Boolean(p.name && p.sku && p.currency && typeof p.price === "number");
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "muted" | "info" }) {
  const toneClasses =
    tone === "info"
      ? "bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
      : tone === "muted"
      ? "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
      : "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</p>
      <p className={`text-2xl font-semibold ${toneClasses} mt-2 rounded-xl px-3 py-2`}>{value}</p>
    </div>
  );
}
