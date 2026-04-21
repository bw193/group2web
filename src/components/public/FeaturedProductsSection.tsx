'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import ProductCard from './ProductCard';
import WordsReveal from './WordsReveal';
import MagneticLink from './MagneticLink';

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
    <section className="relative py-28 md:py-40 bg-sand bg-arch-grid overflow-hidden">
      {/* Top hairline divider */}
      <span aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-bronze/40" />
      {/* Atmospheric blob */}
      <span className="blob blob-c" style={{ width: 520, height: 520, top: '10%', right: '-180px' }} aria-hidden />

      <div className="container-wide relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16 md:mb-20">
          <div>
            <div className="flex items-center gap-3 mb-6" data-reveal>
              <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse" />
              <span className="text-[11px] font-body text-ink-mid tracking-[0.3em] uppercase">
                Featured
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-light leading-[0.95] text-ink">
              <WordsReveal text={t('featuredProducts')} />
            </h2>
          </div>
          <div data-reveal>
            <MagneticLink
              href={`/${locale}/products`}
              className="group inline-flex items-center gap-3 px-7 py-4 border border-ink text-ink hover:bg-ink hover:text-cream text-[12px] font-body font-medium tracking-[0.18em] uppercase rounded-full transition-colors duration-500 self-start md:self-auto"
            >
              {t('viewAll')}
              <span className="text-bronze group-hover:text-cream transition-colors">→</span>
            </MagneticLink>
          </div>
        </div>

        {/* Category filter — borderless pill row */}
        {tabs.length > 1 && (
          <div
            className="mb-12 md:mb-14"
            role="tablist"
            aria-label="Product categories"
          >
            <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
              {tabs.map((tab) => {
                const active = tab.id === activeId;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveId(tab.id)}
                    className={`whitespace-nowrap px-6 py-3 text-[12px] font-body font-medium tracking-[0.12em] uppercase rounded-full transition-all duration-500 ease-out-expo ${
                      active
                        ? 'bg-ink text-cream shadow-[0_10px_30px_-10px_rgba(42,38,32,0.35)] scale-[1.02]'
                        : 'bg-transparent text-ink-mid hover:text-ink hover:bg-bronze-subtle/60 hover:scale-[1.02]'
                    }`}
                  >
                    {tab.label}
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
