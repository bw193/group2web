'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ProductCard from './ProductCard';

interface FeaturedProduct {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string | null;
  modelNumber?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
  categoryId: number | null;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface Props {
  products: FeaturedProduct[];
  categories: CategoryOption[];
  locale: string;
  maxVisible?: number;
}

export default function FeaturedProductsSection({
  products,
  categories,
  locale,
  maxVisible = 8,
}: Props) {
  const t = useTranslations('home');
  const [activeId, setActiveId] = useState<number | 'all'>('all');

  // Only show category chips that actually have featured products.
  const availableCategories = useMemo(() => {
    const ids = new Set(products.map((p) => p.categoryId).filter((v): v is number => v != null));
    return categories.filter((c) => ids.has(c.id));
  }, [products, categories]);

  const filtered = useMemo(() => {
    const list = activeId === 'all'
      ? products
      : products.filter((p) => p.categoryId === activeId);
    return list.slice(0, maxVisible);
  }, [products, activeId, maxVisible]);

  if (products.length === 0) return null;

  // Short localized label for the "All" tab
  const allLabels: Record<string, string> = {
    en: 'All', es: 'Todos', pt: 'Todos', fr: 'Tout', it: 'Tutti', de: 'Alle',
  };
  const allLabel = allLabels[locale] || 'All';

  const tabs: { id: number | 'all'; label: string }[] = [
    { id: 'all', label: allLabel },
    ...availableCategories.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <section className="section-padding bg-sand">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10" data-reveal>
          <div>
            <h2 className="section-heading">{t('featuredProducts')}</h2>
            <div className="w-12 h-px bg-bronze mt-6" />
          </div>
          <Link
            href={`/${locale}/products`}
            className="btn-outline mt-6 md:mt-0 text-xs uppercase tracking-[0.1em] self-start md:self-auto"
          >
            {t('viewAll')}
          </Link>
        </div>

        {/* Category filter — editorial tab bar */}
        {tabs.length > 1 && (
          <div
            className="relative border-y border-warm-border mb-12"
            role="tablist"
            aria-label="Product categories"
          >
            {/* Horizontal scroller for small screens */}
            <div className="flex gap-1 md:gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
              {tabs.map((tab) => {
                const active = tab.id === activeId;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveId(tab.id)}
                    className={`group relative whitespace-nowrap py-4 md:py-5 px-3 md:px-5 text-[11px] md:text-xs font-body font-medium tracking-[0.18em] uppercase transition-colors duration-300 ${
                      active ? 'text-ink' : 'text-ink-light hover:text-ink'
                    }`}
                  >
                    {/* Eyebrow numeral */}
                    <span
                      className={`absolute top-1 left-3 md:left-5 text-[9px] font-body font-light tracking-[0.25em] transition-opacity duration-300 ${
                        active ? 'text-bronze opacity-100' : 'text-ink-light/50 opacity-0 group-hover:opacity-60'
                      }`}
                    >
                      {tab.id === 'all' ? '·' : String(availableCategories.findIndex((c) => c.id === tab.id) + 1).padStart(2, '0')}
                    </span>

                    <span className="relative">
                      {tab.label}
                      {/* Active underline */}
                      <span
                        className={`absolute -bottom-4 md:-bottom-5 left-1/2 -translate-x-1/2 h-px bg-bronze transition-all duration-500 ease-out-expo ${
                          active ? 'w-full' : 'w-0 group-hover:w-1/3'
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product grid: up to 4 per row */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-xl text-ink-mid">{t('featuredProducts')}</p>
          </div>
        ) : (
          <div
            key={activeId}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10 animate-fade-up"
          >
            {filtered.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
