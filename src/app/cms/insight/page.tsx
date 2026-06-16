'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Star, Search, FolderTree } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';
import { useT } from '../_lib/i18n';

interface ArticleRow {
  id: number;
  category: string;
  readMinutes: number;
  isFeatured: boolean;
  isActive: boolean;
  publishedAt: string;
  coverImageUrl: string | null;
  thumbnailUrl: string | null;
  title: string;
  slug: string;
  locales: string[];
}

interface CategoryOption {
  key: string;
  name: string;
}

export default function InsightListPage() {
  const { t } = useT();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  function categoryLabel(c: string) {
    return categories.find((cat) => cat.key === c)?.name || c;
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [artRes, catRes] = await Promise.all([
      fetch('/api/articles'),
      fetch('/api/article-categories'),
    ]);
    if (artRes.ok) setArticles(await artRes.json());
    if (catRes.ok) {
      const cats = await catRes.json();
      setCategories(
        (Array.isArray(cats) ? cats : []).map((c: any) => ({
          key: c.key,
          name: c.names?.en || c.key,
        })),
      );
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t('art.confirmDelete'))) return;
    await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    fetchData();
  }

  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.slug.includes(search.toLowerCase());
    const matchCat = !filterCategory || a.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('art.title')}</h1>
        <div className="flex gap-2">
          <Link href="/cms/insight/categories" className="btn-outline text-sm">
            <FolderTree size={16} className="mr-1" /> {t('acat.manage')}
          </Link>
          <Link href="/cms/insight/new" className="btn-primary text-sm">
            <Plus size={16} className="mr-1" /> {t('art.add')}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="cms-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('art.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field md:w-48">
            <option value="">{t('art.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Article Table */}
      <div className="cms-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 w-16">{t('art.col.cover')}</th>
              <th className="text-left py-3">{t('art.col.title')}</th>
              <th className="text-left py-3">{t('art.col.category')}</th>
              <th className="text-left py-3">{t('art.col.published')}</th>
              <th className="text-left py-3">{t('art.col.featured')}</th>
              <th className="text-left py-3">{t('art.col.status')}</th>
              <th className="text-left py-3">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((article) => (
              <tr key={article.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2">
                  {article.thumbnailUrl || article.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getUploadUrl(article.thumbnailUrl || article.coverImageUrl)}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 uppercase">
                      {article.category.slice(0, 3)}
                    </div>
                  )}
                </td>
                <td className="py-2 font-medium max-w-md">
                  <span className="line-clamp-2">{article.title}</span>
                  <span className="block text-xs text-text-secondary font-normal mt-0.5">/{article.slug}</span>
                </td>
                <td className="py-2 text-text-secondary">{categoryLabel(article.category)}</td>
                <td className="py-2 text-text-secondary whitespace-nowrap">{article.publishedAt?.slice(0, 10)}</td>
                <td className="py-2">
                  {article.isFeatured && <Star size={16} className="text-accent-gold fill-accent-gold" />}
                </td>
                <td className="py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      article.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {article.isActive ? t('art.live') : t('art.draft')}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <Link href={`/cms/insight/${article.id}`} className="p-2 hover:bg-gray-100 rounded">
                      <Edit2 size={16} />
                    </Link>
                    <button onClick={() => handleDelete(article.id)} className="p-2 hover:bg-red-50 text-red-500 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-text-secondary py-8">{t('art.empty')}</p>}
      </div>
    </div>
  );
}
