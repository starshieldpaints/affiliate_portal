"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../src/lib/api-client";
import { Badge, EmptyState, FilterPill, LoadingRow, PageHeader, SearchInput } from "../../../src/lib/ui";
import { ImageOff, Pencil, Plus, Save, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  status: "active" | "inactive";
  categoryId?: string | null;
  categoryName?: string;
  description?: string | null;
  imageUrl?: string | null;
};

export default function ProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ status: "all", search: "", category: "all" });
  const [editing, setEditing] = useState<Partial<ProductRow> | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<ProductRow | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapProduct = (item: any): ProductRow => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    price: Number(item.price ?? 0),
    currency: item.currency ?? "INR",
    status: item.isActive ? "active" : "inactive",
    categoryId: item.categoryId ?? item.category?.id,
    categoryName: item.category?.name ?? item.categoryName ?? undefined,
    description: item.description,
    imageUrl: item.imageUrl
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listProducts();
      setRows(res.data.map(mapProduct));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.categoryName && set.add(r.categoryName));
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchStatus = filters.status === "all" || r.status === filters.status;
      const matchCategory = filters.category === "all" || r.categoryName === filters.category;
      const term = filters.search.trim().toLowerCase();
      const matchSearch = !term || r.name.toLowerCase().includes(term) || r.sku.toLowerCase().includes(term);
      return matchStatus && matchCategory && matchSearch;
    });
  }, [rows, filters]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const inactive = rows.length - active;
    return { active, inactive, total: rows.length };
  }, [rows]);

  const startCreate = () =>
    setEditing({
      name: "",
      sku: "",
      price: 0,
      currency: "INR",
      status: "active",
      description: "",
      imageUrl: ""
    });

  const startEdit = (row: ProductRow) => setEditing(row);

  const save = async () => {
    if (!editing || !isValid(editing)) return;
    setLoading(true);
    try {
      if (editing.id) {
        const updated = await adminApi.updateProduct(editing.id, {
          name: editing.name!,
          sku: editing.sku!,
          price: editing.price!,
          currency: editing.currency!,
          isActive: (editing.status ?? "active") === "active",
          categoryId: editing.categoryId ?? null,
          description: editing.description,
          imageUrl: editing.imageUrl
        } as any);
        setRows((prev) => prev.map((p) => (p.id === updated.id ? mapProduct(updated) : p)));
      } else {
        const created = await adminApi.createProduct({
          name: editing.name!,
          sku: editing.sku!,
          price: editing.price!,
          currency: editing.currency!,
          isActive: (editing.status ?? "active") === "active",
          categoryId: editing.categoryId ?? null,
          description: editing.description,
          imageUrl: editing.imageUrl
        } as any);
        setRows((prev) => [mapProduct(created), ...prev]);
      }
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (row: ProductRow) => {
    setLoading(true);
    try {
      const updated = await adminApi.updateProduct(row.id, { isActive: row.status !== "active" } as any);
      setRows((prev) => prev.map((p) => (p.id === row.id ? mapProduct(updated) : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update product");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (row: ProductRow) => {
    setLoading(true);
    try {
      await adminApi.deleteProduct(row.id);
      setRows((prev) => prev.filter((p) => p.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 pb-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Products"
        eyebrow="Catalog"
        description="A calm, spacious view to browse, filter, and manage your catalog without clutter."
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            onClick={startCreate}
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        }
      />

      <section className="space-y-8 rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
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
            <FilterPill
              label="Category"
              value={filters.category}
              onChange={(value) => setFilters((f) => ({ ...f, category: value }))}
              options={[{ value: "all", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              placeholder="Search name or SKU"
              value={filters.search}
              onChange={(next) => setFilters((f) => ({ ...f, search: next }))}
            />
            <div className="hidden gap-2 text-xs text-muted md:flex">
              <Badge tone="info">Total {stats.total}</Badge>
              <Badge tone="success">Active {stats.active}</Badge>
              <Badge tone="muted">Inactive {stats.inactive}</Badge>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <LoadingRow label="Loading products..." />
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState title="No products found." />
        ) : (
          <div className="grid gap-8 xl:gap-10 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
            {filteredRows.map((row) => (
              <article
                key={row.id}
                className="group relative flex h-full flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-4">
                  {row.imageUrl ? (
                    <Image
                      src={row.imageUrl}
                      alt={row.name}
                      width={140}
                      height={140}
                      className="h-28 w-28 flex-shrink-0 rounded-3xl object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                      <ImageOff className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 leading-tight font-semibold text-slate-900 dark:text-white" title={row.name}>
                        {row.name}
                      </p>
                      <Badge className="shrink-0" tone={row.status === "active" ? "success" : "muted"}>
                        {row.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      {row.categoryName || "Uncategorized"}
                    </p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {currency(row.price, row.currency)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">SKU: {row.sku}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="min-h-[64px] text-sm leading-relaxed text-slate-600 line-clamp-4 dark:text-slate-200" title={row.description || undefined}>
                    {row.description || "No description"}
                  </p>
                  {row.description && row.description.length > 120 && (
                    <button className="text-xs font-semibold text-brand hover:underline" onClick={() => setDescriptionModal(row)}>
                      Read more
                    </button>
                  )}
                </div>

                <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
                    onClick={() => startEdit(row)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800"
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
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-500 hover:text-rose-700 dark:border-rose-500/60 dark:bg-slate-800"
                    onClick={() => remove(row)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Product</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{editing.id ? "Edit product" : "New product"}</h3>
              </div>
              <button className="text-sm font-semibold text-brand hover:underline" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Name" value={editing.name ?? ""} onChange={(v) => setEditing((p) => ({ ...(p ?? {}), name: v }))} />
              <Field label="SKU" value={editing.sku ?? ""} onChange={(v) => setEditing((p) => ({ ...(p ?? {}), sku: v }))} />
              <Field label="Price" value={editing.price?.toString() ?? ""} onChange={(v) => setEditing((p) => ({ ...(p ?? {}), price: Number(v) || 0 }))} />
              <Field label="Currency" value={editing.currency ?? "INR"} onChange={(v) => setEditing((p) => ({ ...(p ?? {}), currency: v }))} />
              <Field label="Category" value={editing.categoryName ?? ""} onChange={(v) => setEditing((p) => ({ ...(p ?? {}), categoryName: v }))} />
              <Field label="Status" value={editing.status ?? "active"} onChange={(v) => setEditing((p) => ({ ...(p ?? {}), status: v as any }))} />
              <Field label="Image URL" value={editing.imageUrl ?? ""} onChange={(v) => setEditing((p) => ({ ...(p ?? {}), imageUrl: v }))} />
              <Field label="Description" value={editing.description ?? ""} onChange={(v) => setEditing((p) => ({ ...(p ?? {}), description: v }))} />
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
                onClick={save}
                disabled={!isValid(editing) || loading}
              >
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {descriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.35em] text-brand">Product</p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{descriptionModal.name}</h3>
                <p className="text-sm text-muted">{descriptionModal.sku}</p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
                onClick={() => setDescriptionModal(null)}
              >
                <X className="h-4 w-4" /> Close
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-[220px,1fr] md:items-start">
              <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800">
                {descriptionModal.imageUrl ? (
                  <Image
                    src={descriptionModal.imageUrl}
                    alt={descriptionModal.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 220px"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="space-y-3 text-slate-700 dark:text-slate-200">
                <p className="whitespace-pre-line leading-relaxed">{descriptionModal.description || "No description provided."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">{label}</span>
      <input
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function currency(value?: number, currencyCode = "INR") {
  if (value === undefined || value === null || Number.isNaN(value)) return "â‚¹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value);
}

function isValid(editing: Partial<ProductRow> | null) {
  return Boolean(editing?.name && editing?.sku && editing?.currency);
}

