'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import ProductCard from '@/components/public/ProductCard';

interface Product {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  modelNumber: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  categoryId: number | null;
}

interface Category {
  id: number;
  name: string;
}

interface ProductsFilterProps {
  products: Product[];
  categories: Category[];
}

export default function ProductsFilter({ products, categories }: ProductsFilterProps) {
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');

  useEffect(() => {
    setSearch(searchParams.get('q') || '');
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.modelNumber && p.modelNumber.toLowerCase().includes(q));
      const matchCategory =
        selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  const allTabs: { id: number | 'all'; label: string }[] = [
    { id: 'all', label: t('allCategories') },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <>
      {/* Filter bar */}
      <section className="bg-cream sticky top-[72px] md:top-20 z-30 border-b border-warm-border">
        <div className="container-wide py-5 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            {/* Category tabs */}
            <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar -mx-1 px-1 flex-1">
              {allTabs.map((tab) => {
                const active = tab.id === selectedCategory;
                return (
                  <button
                    key={String(tab.id)}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`relative whitespace-nowrap py-2 text-[11px] font-body font-medium tracking-[0.22em] uppercase transition-colors duration-300 ${
                      active ? 'text-ink' : 'text-ink-light hover:text-ink'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`absolute left-0 bottom-0 h-px bg-ink transition-all duration-500 ease-out ${
                        active ? 'w-full' : 'w-0'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative md:w-64 flex-shrink-0">
              <Search
                size={14}
                strokeWidth={1.5}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-light"
              />
              <input
                type="text"
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-8 py-2.5 text-sm font-body font-light text-ink placeholder:text-ink-light bg-transparent border-0 border-b border-warm-border focus:outline-none focus:border-ink transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-cream">
        <div className="container-wide py-16 md:py-24">
          <p className="text-[11px] font-body font-medium text-ink-mid tracking-[0.24em] uppercase mb-10 md:mb-14">
            {filtered.length === 0
              ? '— No results'
              : `— Showing ${String(filtered.length).padStart(2, '0')} ${filtered.length === 1 ? 'item' : 'items'}`}
          </p>

          {filtered.length === 0 ? (
            <div className="py-20 text-center border-t border-warm-border">
              <p className="font-display text-2xl font-light text-ink-mid">{t('noProducts')}</p>
            </div>
          ) : (
            <div
              key={`${selectedCategory}-${search}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-14 md:gap-x-10 md:gap-y-16 animate-fade-up"
            >
              {filtered.map((product, i) => (
                <ProductCard key={product.id} index={i} {...product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
