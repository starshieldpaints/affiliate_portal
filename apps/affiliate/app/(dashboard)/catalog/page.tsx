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
import { createPortal } from 'react-dom';
import { LinkBuilder } from '../../../src/components/catalog/LinkBuilder';
import { fallbackCatalogProducts } from '../../../src/data/products';
import { catalogApi } from '../../../src/lib/api-client';
import type { CatalogCategory, CatalogProduct } from '../../../src/types/catalog';

const DEFAULT_PLACEHOLDER = 'https://placehold.co/640x384/png?text=StarShield+Product';

type VariantGroup = {
  baseName: string;
  variants: CatalogProduct[];
};

export default function CatalogPage() {
  const PAGE_VIEW_BATCH = 9;
  const pageSize = 100;
  const initialProducts = fallbackCatalogProducts;
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [availableCategories, setAvailableCategories] = useState<CatalogCategory[]>(() =>
    deriveCategoriesFromProducts(initialProducts)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [stats, setStats] = useState({
    total: fallbackCatalogProducts.length
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
          lastFilters?.length
            ? lastFilters
            : deriveCategoriesFromProducts(resolved.length ? resolved : initialProducts)
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

  const highlightedCategories = useMemo(() => availableCategories.slice(0, 8), [availableCategories]);
  const totalVariants = useMemo(
    () => filteredGroups.reduce((count, group) => count + group.variants.length, 0),
    [filteredGroups]
  );
  const hasMore = visibleCount < filteredGroups.length;

  useEffect(() => {
    setVisibleCount(PAGE_VIEW_BATCH);
  }, [filteredGroups]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore) return;
    setVisibleCount((current) => Math.min(current + PAGE_VIEW_BATCH, filteredGroups.length));
  }, [hasMore, filteredGroups.length]);

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 sm:px-6 lg:px-0">
      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="space-y-6 rounded-4xl border border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-7 py-8 text-white shadow-2xl dark:border-slate-800">
          <p className="text-xs uppercase tracking-[0.5em] text-slate-300">Catalog</p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            Modern surfaces, ready-to-share stories.
          </h1>
          <p className="max-w-2xl text-sm text-slate-200">
            Discover every SKU, attach your tracking presets, and grab battle-tested creatives in one
            spacious view. We sync nightly with the product database so pricing, imagery, and stock
            data stay trustworthy.
          </p>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-slate-300">
            {[
              `${stats.total.toLocaleString()} SKUs in inventory`,
              `${availableCategories.length} curated categories`,
              `${totalVariants.toLocaleString()} live variants`
            ].map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/30 px-4 py-1 backdrop-blur-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Catalog size" value={formatNumber(stats.total)} hint="Active SKUs" />
          <StatCard
            label="Visible variants"
            value={formatNumber(totalVariants)}
            hint={selectedCategory === 'all' ? 'All categories' : 'Filtered selection'}
          />
          <StatCard
            label="Category count"
            value={availableCategories.length}
            hint="Curated groupings"
          />
          <StatCard label="Data refresh" value="Nightly" hint="2:00 AM IST" />
        </div>
      </section>

      <section className="rounded-4xl border border-slate-200/80 bg-white/90 px-5 py-6 shadow-lg dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Search catalog
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Try 'Shield Lite' or a SKU"
              className="form-input mt-1"
            />
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Filter by category
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as typeof selectedCategory)}
              className="form-input mt-1"
            >
              <option value="all">All categories</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {highlightedCategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto no-scrollbar text-sm">
            {highlightedCategories.map((category) => {
              const isActive = category.id === selectedCategory;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(isActive ? 'all' : category.id)}
                  className={`rounded-full border px-4 py-1 transition ${
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
        {(searchTerm || selectedCategory !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="mt-4 inline-flex items-center text-sm font-medium text-brand hover:underline"
          >
            Reset filters
          </button>
        )}
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/30">
          <p className="text-sm text-muted">Syncing catalog…</p>
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/80 p-10 text-center text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
          Nothing matches that filter yet. Try another search or category.
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.slice(0, visibleCount).map((group, index) => (
            <CatalogCard
              key={group.variants[0]?.id ?? `${group.baseName}-${index}`}
              group={group}
            />
          ))}
        </section>
      )}
      <div ref={loadMoreRef} />

      <section className="rounded-4xl border border-slate-200/80 bg-white/90 px-5 py-4 text-sm text-slate-700 shadow-lg dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-200 sm:flex sm:items-center sm:justify-between">
        <p>
          Showing <span className="font-semibold">{filteredGroups.length}</span> grouped products (
          {totalVariants.toLocaleString()} variants)
        </p>
        {loading && (
          <span className="text-xs uppercase tracking-wide text-muted">Refreshing catalog…</span>
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

function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/90 px-4 py-5 text-slate-800 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-100">
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function CatalogCard({ group }: { group: VariantGroup }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const variant = group.variants[selectedIndex] ?? group.variants[0];

  useEffect(() => {
    setSelectedIndex(0);
  }, [group.baseName, group.variants.length]);

  if (!variant) {
    return null;
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-100/80 bg-gradient-to-br from-white via-white to-slate-50 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-2xl dark:border-slate-800/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="relative h-64 bg-slate-100 dark:bg-slate-800">
        <Image
          src={variant.imageUrl ?? DEFAULT_PLACEHOLDER}
          alt={variant.name}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain object-center p-6 transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/0" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/90 px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-slate-950/10 backdrop-blur dark:bg-slate-900/80 dark:text-white">
          <span className="truncate">{variant.category?.name ?? 'Uncategorized'}</span>
          <span className="text-brand">{formatPrice(variant.price, variant.currency)}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-brand">
            <span>Featured SKU</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 tracking-normal text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {variant.sku ?? variant.id}
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{group.baseName}</h2>
            <DescriptionWithReadMore
              label={deriveVariantLabel(variant)}
              description={variant.description ?? ''}
            />
          </div>
        </div>

        {group.variants.length > 1 && (
          <div className="no-scrollbar flex flex-nowrap gap-2 overflow-x-auto rounded-2xl border border-slate-200/70 bg-slate-50/60 p-2 dark:border-slate-800/60 dark:bg-slate-900/60">
            {group.variants.map((variantOption, idx) => {
              const active = idx === selectedIndex;
              const measurement = getVariantMeasurement(variantOption);
              return (
                <button
                  key={variantOption.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`inline-flex min-w-[90px] shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-slate-200 text-slate-500 hover:border-brand/50 hover:text-brand dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-current" />
                  <span className="text-sm font-semibold">
                    {measurement.unit ? `${measurement.amount} ${measurement.unit}` : measurement.amount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs text-muted sm:grid-cols-3">
          <InfoBubble label="Conversion" value={variant.conversion ?? 'N/A'} />
          <InfoBubble label="Price" value={formatPrice(variant.price, variant.currency)} />
          <InfoBubble label="Status" value="Ready" tone="success" />
        </div>

        <div className="mt-auto rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-800/60 dark:bg-slate-900/60">
          <LinkBuilder
            product={{
              id: variant.id,
              name: variant.name,
              sku: variant.sku ?? variant.id,
              landingUrl: variant.landingUrl
            }}
            downloadUrl={variant.imageUrl ?? variant.landingUrl}
          />
        </div>
      </div>
    </article>
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
    <div className="flex flex-col rounded-xl bg-white/80 px-3 py-2 text-left dark:bg-slate-900/70">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold break-all ${toneClasses}`}>{value}</p>
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
      <p className="text-sm leading-relaxed text-muted break-words">
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

function formatPrice(value: number, currency: string) {
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
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
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

function deriveVariantLabel(product: CatalogProduct) {
  const match = product.name.match(/- ?([\w\s]+)$/);
  if (match?.[1]) {
    return match[1].trim();
  }
  return product.sku ?? product.id;
}


function getVariantMeasurement(product: CatalogProduct) {
  const parsed = extractQuantityParts(product.name) ?? extractQuantityParts(product.sku ?? '') ?? extractQuantityParts(product.id ?? '');
  if (parsed) {
    return parsed;
  }
  return { amount: deriveVariantLabel(product), unit: '' };
}
function extractQuantityParts(value?: string | null) {
  if (!value) {
    return null;
  }
  const match = value.match(/(\d+(?:\.\d+)?)\s*(ltr|l|kg|ml|g)\b/i);
  if (!match) {
    return null;
  }
  const amount = match[1];
  const unitKey = match[2].toLowerCase();
  return { amount, unit: formatUnit(unitKey, true) };
}

function formatUnit(unitKey: string, lowercase = false) {
  const map: Record<string, string> = {
    l: lowercase ? 'ltr' : 'Ltr',
    ltr: lowercase ? 'ltr' : 'Ltr',
    kg: lowercase ? 'kg' : 'Kg',
    ml: lowercase ? 'ml' : 'ml',
    g: lowercase ? 'g' : 'g'
  };
  return map[unitKey] ?? (lowercase ? unitKey.toLowerCase() : unitKey.toUpperCase());
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
