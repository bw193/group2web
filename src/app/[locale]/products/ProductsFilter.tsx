'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    setSearch(searchParams.get('q') || '');
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.modelNumber && p.modelNumber.toLowerCase().includes(q));
      const matchCategory = !selectedCategory || String(p.categoryId) === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-light" />
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-6"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field md:w-56"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <section className="section-padding bg-cream">
        <div className="container-wide">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl font-display text-ink-mid">{t('noProducts')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  shortDescription={product.shortDescription}
                  modelNumber={product.modelNumber}
                  imageUrl={product.imageUrl}
                  isFeatured={product.isFeatured}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
