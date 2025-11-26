'use client';

import { useEffect, useState } from 'react';

type Option = { id: string; label: string };

type Props = {
  selectedProductIds: string[];
  selectedCategoryIds: string[];
  selectedAffiliateIds: string[];
  onChange: (next: {
    productIds: string[];
    categoryIds: string[];
    affiliateIds: string[];
  }) => void;
};

export function ScopeSelector({
  selectedProductIds,
  selectedCategoryIds,
  selectedAffiliateIds,
  onChange
}: Props) {
  const [products, setProducts] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [affiliates, setAffiliates] = useState<Option[]>([]);

  useEffect(() => {
    // TODO: replace with real API endpoints when available
    setProducts([]);
    setCategories([]);
    setAffiliates([]);
  }, []);

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
          Products
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {products.length === 0 && (
            <span className="text-xs text-slate-500">No product scopes available.</span>
          )}
          {products.map((p) => {
            const active = selectedProductIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  onChange({
                    productIds: toggle(selectedProductIds, p.id),
                    categoryIds: selectedCategoryIds,
                    affiliateIds: selectedAffiliateIds
                  })
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
          Categories
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.length === 0 && (
            <span className="text-xs text-slate-500">No category scopes available.</span>
          )}
          {categories.map((c) => {
            const active = selectedCategoryIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  onChange({
                    productIds: selectedProductIds,
                    categoryIds: toggle(selectedCategoryIds, c.id),
                    affiliateIds: selectedAffiliateIds
                  })
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
          Affiliates
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {affiliates.length === 0 && (
            <span className="text-xs text-slate-500">No affiliate scopes available.</span>
          )}
          {affiliates.map((a) => {
            const active = selectedAffiliateIds.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  onChange({
                    productIds: selectedProductIds,
                    categoryIds: selectedCategoryIds,
                    affiliateIds: toggle(selectedAffiliateIds, a.id)
                  })
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200'
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
