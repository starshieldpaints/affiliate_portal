'use client';

import Image from 'next/image';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Link from 'next/link';
import { catalogApi } from '../../../src/lib/api-client';
import type { CatalogCategory, CatalogProduct } from '../../../src/types/catalog';

const DEFAULT_PLACEHOLDER = 'https://placehold.co/640x384/png?text=StarShield+Product';

type VariantGroup = {
  baseName: string;
  variants: CatalogProduct[];
};

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';

export default function CatalogPage() {
  const PAGE_VIEW_BATCH = 9;
  const pageSize = 100;
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CatalogCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [sort, setSort] = useState<SortOption>('relevance');
  const [stats, setStats] = useState({
    total: 0
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_VIEW_BATCH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const aggregated: CatalogProduct[] = [];
        let nextPage = 1;
        let hasNextPage = true;
        let lastFilters: CatalogCategory[] | undefined;
        let totalFromServer = stats.total;

        while (hasNextPage) {
          const response = await catalogApi.list({
            page: nextPage,
            pageSize
          });

          aggregated.push(...response.data);
          if (response.filters?.categories?.length) {
            lastFilters = response.filters.categories;
          }
          if (typeof response.meta?.total === 'number') {
            totalFromServer = response.meta.total;
          }

          hasNextPage = response.meta?.hasNextPage ?? false;
          nextPage += 1;

          if (!hasNextPage || response.data.length === 0) {
            break;
          }
        }

        if (!isMounted) return;
        const resolved = aggregated.length ? aggregated : [];
        setProducts(resolved);
        setAvailableCategories(
          lastFilters?.length ? lastFilters : deriveCategoriesFromProducts(resolved)
        );
        setStats({
          total: totalFromServer ?? resolved.length
        });
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : 'Unable to load products right now.';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
// commit
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [pageSize]);

  const groupedProducts = useMemo(() => groupProducts(products), [products]);

  const filteredGroups = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const filtered = groupedProducts.filter((group) => {
      const matchesSearch =
        !query ||
        group.baseName.toLowerCase().includes(query) ||
        group.variants.some(
          (variant) =>
            variant.name.toLowerCase().includes(query) ||
            (variant.sku ?? '').toLowerCase().includes(query)
        );

      const matchesCategory =
        selectedCategory === 'all' ||
        group.variants.some((variant) => {
          const variantCategoryId = normalizeCategoryIdentifier(
            variant.category?.id ?? variant.categoryId ?? null
          );
          return variantCategoryId === selectedCategory;
        });
      return matchesSearch && matchesCategory;
    });

    // Flatten identical base names to a single group (in case of data anomalies)
    const collapsed = new Map<string, VariantGroup>();
    for (const group of filtered) {
      if (!collapsed.has(group.baseName)) {
        collapsed.set(group.baseName, { ...group, variants: [...group.variants] });
        continue;
      }
      const existing = collapsed.get(group.baseName)!;
      const merged = [...existing.variants, ...group.variants];
      collapsed.set(group.baseName, {
        ...existing,
        variants: merged.sort((a, b) => a.price - b.price)
      });
    }
    return Array.from(collapsed.values());
  }, [groupedProducts, deferredSearchTerm, selectedCategory]);

  const sortedGroups = useMemo(() => {
    if (sort === 'relevance') return filteredGroups;
    const copy = [...filteredGroups];
    switch (sort) {
      case 'price-asc':
        return copy.sort((a, b) => (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0));
      case 'price-desc':
        return copy.sort((a, b) => (b.variants[0]?.price ?? 0) - (a.variants[0]?.price ?? 0));
      case 'name-asc':
        return copy.sort((a, b) => a.baseName.localeCompare(b.baseName));
      default:
        return copy;
    }
  }, [filteredGroups, sort]);

  const highlightedCategories = useMemo(() => availableCategories.slice(0, 8), [availableCategories]);
  const totalVariants = useMemo(
    () => sortedGroups.reduce((count, group) => count + group.variants.length, 0),
    [sortedGroups]
  );
  const hasMore = visibleCount < sortedGroups.length;

  useEffect(() => {
    setVisibleCount(PAGE_VIEW_BATCH);
  }, [sortedGroups]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((current) => Math.min(current + PAGE_VIEW_BATCH, sortedGroups.length));
  }, [hasMore, sortedGroups.length]);

  useEffect(() => {
    if (!hasMore) {
      return;
    }
    const target = loadMoreRef.current;
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleLoadMore();
          }
        });
      },
      {
        rootMargin: '200px'
      }
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, handleLoadMore]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 shadow-lg dark:border-slate-800">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-3 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand/80">
              Affiliate catalog
            </p>
            <h1 className="text-4xl font-semibold leading-tight">
              Pick the perfect SKU in under a minute.
            </h1>
            <p className="text-sm text-slate-200">
              Search, filter, and ship links without wading through PDFs. Designed for fast,
              confident selection on any device.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-200/90">
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">
                Realtime filters
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">
                Instant link-ready
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">
                Mobile-friendly
              </span>
            </div>
          </div>
          <dl className="grid w-full max-w-md gap-3 text-xs uppercase tracking-[0.35em] text-slate-200 sm:grid-cols-3">
            <StatPill label="Products live" value={formatNumber(stats.total)} />
            <StatPill label="Categories" value={availableCategories.length.toString()} />
            <StatPill label="Variants visible" value={formatNumber(totalVariants)} />
          </dl>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Filters</p>
            <p className="text-base font-semibold text-slate-900 dark:text-white">Dial in the catalog</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <span>Sort</span>
              <div className="relative flex items-center">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  className="appearance-none rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-inner transition focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name A-Z</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
              </div>
            </label>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSort('relevance');
                }}
                className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span>Search catalog</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder='Try "Shield Lite" or drop a SKU'
              className="form-input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span>Filter by category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as typeof selectedCategory)}
              className="form-input"
            >
              <option value="all">All categories</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Live variants</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {formatNumber(totalVariants)}
            </p>
            <p className="text-xs text-muted">
              Matching {selectedCategory === 'all' ? 'all categories' : 'current filters'}
            </p>
          </div>
        </div>

        {highlightedCategories.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 text-sm no-scrollbar">
            {highlightedCategories.map((category) => {
              const isActive = category.id === selectedCategory;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(isActive ? 'all' : category.id)}
                  className={`rounded-full border px-4 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    isActive
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-slate-200 text-slate-600 hover:border-brand/60 hover:text-brand dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 grid gap-3 text-xs text-muted sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Grouped products</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
              {formatNumber(filteredGroups.length)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Variant density</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
              {filteredGroups.length ? (totalVariants / filteredGroups.length).toFixed(1) : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Search intent</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
              {deferredSearchTerm ? `"${deferredSearchTerm}"` : 'Browsing'}
            </p>
          </div>
        </div>
      </section>


      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 rounded-3xl border border-slate-200/70 bg-slate-50/80 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40"
            >
              <div className="h-full w-full animate-pulse rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700" />
            </div>
          ))}
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/80 p-10 text-center text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
          <p className="mb-4">Nothing matches that filter yet. Try another search or category.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedGroups.slice(0, visibleCount).map((group, index) => (
            <CatalogCard
              key={group.variants[0]?.id ?? `${group.baseName}-${index}`}
              group={group}
            />
          ))}
        </section>
      )}
      <div ref={loadMoreRef} />

      <section className="rounded-[32px] border border-slate-200/80 bg-white/95 px-5 py-5 text-sm text-slate-700 shadow-lg dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-200 sm:flex sm:items-center sm:justify-between">
        <p>
          Showing <span className="font-semibold">{sortedGroups.length}</span> grouped products (
          {totalVariants.toLocaleString()} variants)
        </p>
        {loading && (
          <span className="text-xs uppercase tracking-wide text-muted">Refreshing catalog...</span>
        )}
        {!loading && hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            className="text-xs font-semibold uppercase tracking-wide text-brand hover:underline"
          >
            Load 9 more
          </button>
        )}
      </section>
    </div>
  );
}


function CatalogCard({ group }: { group: VariantGroup }) {
  const variant = group.variants[0];
  if (!variant) return null;

  return (
    <Link
      href={`/catalog/${variant.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-800/60 dark:bg-slate-900"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 dark:bg-slate-800">
        <Image
          src={variant.imageUrl ?? DEFAULT_PLACEHOLDER}
          alt={variant.name}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain object-center p-6 transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-100">
          {variant.category?.name ?? 'Uncategorized'}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{group.baseName}</p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">
          {variant.name}
        </h2>
        <p className="text-sm text-muted line-clamp-2">
          {truncate(variant.description ?? 'Tap to view full details.', 120)}
        </p>
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">From</span>
            <span className="text-xl font-semibold text-slate-900 dark:text-white">
              {formatPrice(variant.price, variant.currency)}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {group.variants.length} variants
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
            {variant.currency || 'USD'}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center shadow-sm backdrop-blur">
      <dt className="text-[11px] uppercase tracking-[0.35em] text-slate-200/80">{label}</dt>
      <dd className="mt-2 text-lg font-semibold text-white">{value}</dd>
    </div>
  );
}

function InfoBubble({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'neutral';
}) {
  const toneClasses =
    tone === 'success'
      ? 'text-emerald-600 dark:text-emerald-300'
      : tone === 'warning'
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-slate-900 dark:text-slate-100';
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-left dark:border-slate-800/60 dark:bg-slate-900/60">
      <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{label}</p>
      <p className={`mt-1 text-base font-semibold break-words ${toneClasses}`}>{value}</p>
    </div>
  );
}

function DescriptionWithReadMore({
  label,
  description
}: {
  label: string;
  description: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const preview = truncate(description, 140);
  const shouldShowButton = description.length > 140;

  return (
    <>
      <p className="text-sm leading-relaxed break-words text-slate-600 dark:text-slate-300">
        {preview}
        {shouldShowButton && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="ml-2 text-xs font-semibold text-brand hover:underline"
          >
            Read more
          </button>
        )}
      </p>
      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
              <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-semibold text-brand hover:underline"
                  >
                    Close
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {description}
                </p>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function formatPrice(value: number, currency?: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `$${value.toFixed(0)}`;
  }
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function truncate(value: string, max = 120) {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function deriveCategoriesFromProducts(products: CatalogProduct[]): CatalogCategory[] {
  const map = new Map<string, CatalogCategory>();
  products.forEach((product) => {
    const displayName = product.category?.name ?? product.categoryId ?? 'Uncategorized';
    const normalizedId = normalizeCategoryIdentifier(product.category?.id ?? product.categoryId);
    if (!normalizedId) {
      return;
    }
    if (!map.has(normalizedId)) {
      map.set(normalizedId, {
        id: normalizedId,
        name: displayName ?? 'Uncategorized',
        description: product.category?.description ?? null
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function deriveBaseName(name: string) {
  if (!name) {
    return '';
  }
  const normalized = name.replace(/\s*[-(]?\s*\d+(\.\d+)?\s*(ltr|l|kg|ml|g)\s*[)]?/gi, '').trim();
  return normalized.replace(/[-–—]\s*$/, '').trim();
}

function normalizeCategoryIdentifier(value?: string | null) {
  if (!value) {
    return null;
  }
  return value
    .toString()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function groupProducts(products: CatalogProduct[]): VariantGroup[] {
  const map = new Map<string, CatalogProduct[]>();
  for (const product of products) {
    const base = deriveBaseName(product.name);
    if (!map.has(base)) {
      map.set(base, []);
    }
    map.get(base)?.push(product);
  }

  return Array.from(map.entries()).map(([baseName, variants]) => ({
    baseName,
    variants: variants.sort((a, b) => a.price - b.price)
  }));
}

