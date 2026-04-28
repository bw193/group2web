'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
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

  const allLabels: Record<string, string> = {
    en: 'All', es: 'Todos', pt: 'Todos', fr: 'Tout', it: 'Tutti', de: 'Alle',
  };
  const allLabel = allLabels[locale] || 'All';

  const tabs: { id: number | 'all'; label: string }[] = [
    { id: 'all', label: allLabel },
    ...availableCategories.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <section className="bg-cream border-b border-warm-border">
      <div className="container-wide py-20 md:py-24">
        {/* Header — heading, tabs, and CTA grouped as one cluster */}
        <div className="flex flex-col items-center text-center mb-12 md:mb-14">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-ink tracking-[-0.02em] leading-[1.05]" data-reveal>
            {t('featuredProducts')}
          </h2>

          {tabs.length > 1 && (
            <div
              className="mt-8"
              role="tablist"
              aria-label="Product categories"
              data-reveal
            >
              <div className="flex justify-center flex-wrap gap-x-10 gap-y-3 md:gap-x-16 lg:gap-x-20 overflow-x-auto no-scrollbar -mx-1 px-1">
                {tabs.map((tab) => {
                  const active = tab.id === activeId;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveId(tab.id)}
                      className={`relative whitespace-nowrap pb-2 text-[13px] font-body font-semibold tracking-[0.12em] uppercase transition-colors duration-300 ${
                        active ? 'text-ink' : 'text-ink-mid hover:text-ink'
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`absolute left-0 bottom-0 h-0.5 bg-bronze transition-all duration-500 ease-out ${
                          active ? 'w-full' : 'w-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8" data-reveal>
            <Link
              href={`/${locale}/products`}
              className="btn-primary group"
            >
              {t('viewAll')}
              <ArrowRight size={14} strokeWidth={1.75} className="ml-3 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-xl font-normal text-ink-mid">{t('featuredProducts')}</p>
          </div>
        ) : (
          <div
            key={activeId}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-24 md:gap-x-10 md:gap-y-28 animate-fade-up"
          >
            {filtered.map((product, i) => (
              <ProductCard key={product.id} index={i} hideDescription {...product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
