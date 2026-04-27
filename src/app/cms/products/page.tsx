'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Star, Search } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';
import { useT } from '../_lib/i18n';

interface Product {
  id: number;
  name: string;
  slug: string;
  modelNumber: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  categoryId: number | null;
  tags: string[];
}

interface Category {
  id: number;
  name: string;
}

export default function ProductsListPage() {
  const { t } = useT();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [prodRes, catRes] = await Promise.all([
      fetch('/api/products?locale=en&limit=500'),
      fetch('/api/categories?locale=en'),
    ]);
    if (prodRes.ok) setProducts(await prodRes.json());
    if (catRes.ok) setCategories(await catRes.json());
  }

  async function handleDelete(id: number) {
    if (!confirm(t('prod.confirmDelete'))) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    fetchData();
  }

  async function bulkDelete() {
    if (!confirm(t('prod.confirmBulk', { n: selected.size }))) return;
    await Promise.all(Array.from(selected).map((id) => fetch(`/api/products/${id}`, { method: 'DELETE' })));
    setSelected(new Set());
    fetchData();
  }

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.modelNumber?.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !filterCategory || String(p.categoryId) === filterCategory;
    return matchSearch && matchCat;
  });

  function toggleSelect(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('prod.title')}</h1>
        <Link href="/cms/products/new" className="btn-primary text-sm">
          <Plus size={16} className="mr-1" /> {t('prod.add')}
        </Link>
      </div>

      {/* Filters */}
      <div className="cms-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('prod.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field md:w-48">
            <option value="">{t('prod.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {selected.size > 0 && (
            <button onClick={bulkDelete} className="px-4 py-2 bg-red-500 text-white rounded text-sm">
              {t('prod.bulkDelete', { n: selected.size })}
            </button>
          )}
        </div>
      </div>

      {/* Product Table */}
      <div className="cms-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 w-8">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((p) => p.id)) : new Set())}
                />
              </th>
              <th className="text-left py-3">{t('prod.col.image')}</th>
              <th className="text-left py-3">{t('prod.col.name')}</th>
              <th className="text-left py-3">{t('prod.col.model')}</th>
              <th className="text-left py-3">{t('prod.col.featured')}</th>
              <th className="text-left py-3">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2">
                  <input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleSelect(product.id)} />
                </td>
                <td className="py-2">
                  <img src={getUploadUrl(product.imageUrl)} alt="" className="w-12 h-12 object-cover rounded" />
                </td>
                <td className="py-2 font-medium">{product.name}</td>
                <td className="py-2 text-text-secondary">{product.modelNumber || '-'}</td>
                <td className="py-2">
                  {product.isFeatured && <Star size={16} className="text-accent-gold fill-accent-gold" />}
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <Link href={`/cms/products/${product.id}`} className="p-2 hover:bg-gray-100 rounded">
                      <Edit2 size={16} />
                    </Link>
                    <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 text-red-500 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-text-secondary py-8">{t('prod.empty')}</p>}
      </div>
    </div>
  );
}
