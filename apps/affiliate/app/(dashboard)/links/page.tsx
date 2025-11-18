'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LinkBuilder } from '../../../src/components/catalog/LinkBuilder';
import { catalogApi } from '../../../src/lib/api-client';
import type { CatalogProduct } from '../../../src/types/catalog';

const PAGE_SIZE = 30;

export default function LinksPage() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedPage, setLastFetchedPage] = useState(0);

  const fetchPage = useCallback(
    async (pageToFetch: number, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await catalogApi.list({ page: pageToFetch, pageSize: PAGE_SIZE });
        setMeta(response.meta);
        setProducts((prev) => {
          if (replace) {
            return response.data;
          }
          const merged = new Map<string, CatalogProduct>();
          prev.forEach((product) => merged.set(product.id, product));
          response.data.forEach((product) => merged.set(product.id, product));
          return Array.from(merged.values());
        });
        setLastFetchedPage(pageToFetch);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to load products. Try again shortly.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPage(1, true).catch(() => null);
  }, [fetchPage]);

  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
      return;
    }
    if (selectedProductId && !products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(products[0]?.id ?? null);
    }
  }, [products, selectedProductId]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      const needle = q;
      return (
        product.name.toLowerCase().includes(needle) ||
        (product.sku ?? '').toLowerCase().includes(needle) ||
        (product.category?.name ?? '').toLowerCase().includes(needle)
      );
    });
  }, [products, query]);

  const selectedProduct =
    filteredProducts.find((product) => product.id === selectedProductId) ??
    filteredProducts[0] ??
    null;

  const handleLoadMore = () => {
    if (!meta.hasNextPage || loading) {
      return;
    }
    const nextPage = Math.max(1, lastFetchedPage + 1);
    fetchPage(nextPage).catch(() => null);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-brand">Link studio</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Create shareable links</h1>
        <p className="max-w-3xl text-sm text-muted">
          Pick a product, customize your UTM tagging, and copy a ready-to-share tracking link. This workspace keeps
          your presets handy and helps you switch products quickly.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-black/30">
          <div className="flex flex-col gap-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Search catalog
              <input
                className="form-input mt-2"
                placeholder="Search by product, SKU, or category"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/70">
              {filteredProducts.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted">
                  {loading ? 'Loading productsâ€¦' : 'No products match that search.'}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((product) => {
                    const isActive = product.id === selectedProduct?.id;
                    return (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedProductId(product.id)}
                          className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                            isActive
                              ? 'bg-brand/10 text-slate-900 dark:text-white'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                          }`}
                        >
                          <span className="text-sm font-semibold">{product.name}</span>
                          <span className="text-xs text-muted">
                            {product.category?.name ?? 'Uncategorized'} - {product.sku ?? '--'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-2 text-xs text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
                {error}
              </p>
            )}
            {meta.hasNextPage && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                {loading ? 'Loadingâ€¦' : 'Load more products'}
              </button>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-black/30">
          {selectedProduct ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-brand">Selected product</p>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{selectedProduct.name}</h2>
                <p className="text-sm text-muted">{selectedProduct.description}</p>
              </div>
              <LinkBuilder
                product={{
                  id: selectedProduct.id,
                  name: selectedProduct.name,
                  sku: selectedProduct.sku ?? selectedProduct.id,
                  landingUrl: selectedProduct.landingUrl
                }}
                downloadUrl={selectedProduct.imageUrl ?? selectedProduct.landingUrl}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted">
              <p className="text-base font-semibold text-slate-600 dark:text-slate-300">Select a product to begin</p>
              <p className="mt-2 text-sm">
                Pick something from the catalog list on the left to unlock link generation controls.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

