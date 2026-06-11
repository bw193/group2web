'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, X, Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import Link from 'next/link';
import { getUploadUrl, slugify } from '@/lib/utils';
import { useT } from '../../_lib/i18n';
import RichTextEditor from '../../_components/RichTextEditor';

interface ProductOption {
  id: number;
  name: string;
  modelNumber: string | null;
  imageUrl: string | null;
}

interface CategoryOption {
  key: string;
  name: string;
}

export default function ArticleEditPage() {
  const { t } = useT();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    category: 'design',
    readMinutes: '5',
    publishedAt: new Date().toISOString().slice(0, 10),
    isFeatured: false,
    isActive: true,
    coverImageUrl: '',
    thumbnailUrl: '',
    title: '',
    slug: '',
    dek: '',
    author: '',
    body: '',
  });

  // Product linking
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [productIds, setProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // CMS-managed categories
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [uploading, setUploading] = useState<'' | 'cover' | 'thumb'>('');

  useEffect(() => {
    fetch('/api/article-categories')
      .then((r) => r.json())
      .then((cats) => {
        const list: CategoryOption[] = (Array.isArray(cats) ? cats : []).map((c: any) => ({
          key: c.key,
          name: c.names?.en || c.key,
        }));
        setCategories(list);
        // A new article defaults to the first configured category.
        if (isNew && list.length > 0) {
          setForm((prev) => (list.some((c) => c.key === prev.category) ? prev : { ...prev, category: list[0].key }));
        }
      })
      .catch(() => {});

    fetch('/api/products?locale=en&limit=500')
      .then((r) => r.json())
      .then((list) =>
        setAllProducts(
          (Array.isArray(list) ? list : []).map((p: any) => ({
            id: p.id,
            name: p.name,
            modelNumber: p.modelNumber,
            imageUrl: p.imageUrl,
          })),
        ),
      )
      .catch(() => {});

    if (!isNew) {
      fetch(`/api/articles/${id}`)
        .then((r) => r.json())
        .then((data) => {
          const en = data.translations?.find((tr: any) => tr.locale === 'en') || data.translations?.[0];
          setForm({
            category: data.category || 'design',
            readMinutes: String(data.readMinutes || 5),
            publishedAt: (data.publishedAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
            isFeatured: !!data.isFeatured,
            isActive: data.isActive !== false,
            coverImageUrl: data.coverImageUrl || '',
            thumbnailUrl: data.thumbnailUrl || '',
            title: en?.title || '',
            slug: en?.slug || '',
            dek: en?.dek || '',
            author: en?.author || '',
            body: en?.body || '',
          });
          setProductIds(Array.isArray(data.productIds) ? data.productIds : []);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, kind: 'cover' | 'thumb') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'articles');
    // Name the stored file after the article so URLs stay clean/descriptive.
    fd.append('slug', form.slug || slugify(form.title) || 'article');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      setForm((prev) => (kind === 'cover' ? { ...prev, coverImageUrl: data.url } : { ...prev, thumbnailUrl: data.url }));
    }
    setUploading('');
    e.target.value = '';
  }

  const chosenProducts = useMemo(
    () =>
      productIds
        .map((pid) => allProducts.find((p) => p.id === pid))
        .filter((p): p is ProductOption => !!p),
    [productIds, allProducts],
  );

  const productMatches = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return [];
    return allProducts
      .filter(
        (p) =>
          !productIds.includes(p.id) &&
          (p.name.toLowerCase().includes(q) || p.modelNumber?.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [productSearch, allProducts, productIds]);

  function moveProduct(index: number, direction: -1 | 1) {
    setProductIds((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      category: form.category,
      readMinutes: parseInt(form.readMinutes) || 5,
      publishedAt: form.publishedAt,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      coverImageUrl: form.coverImageUrl || null,
      thumbnailUrl: form.thumbnailUrl || null,
      translations: [
        {
          locale: 'en',
          title: form.title,
          slug: form.slug || slugify(form.title),
          dek: form.dek,
          body: form.body,
          author: form.author,
        },
      ],
      productIds,
    };

    const url = isNew ? '/api/articles' : `/api/articles/${id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/cms/insight');
      return;
    }
    const data = await res.json().catch(() => null);
    setError(data?.error || 'Save failed');
    setSaving(false);
  }

  if (loading) return <div className="text-text-secondary">{t('common.loading')}</div>;

  return (
    <div>
      <Link href="/cms/insight" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft size={16} /> {t('ae.back')}
      </Link>

      <h1 className="text-2xl font-heading font-bold mb-6">{isNew ? t('ae.titleNew') : t('ae.titleEdit')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Article */}
        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-4">{t('ae.article')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('ae.title')} *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('ae.slug')}</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('ae.category')}</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
              >
                {/* Keep an unknown stored key selectable so old data never silently changes. */}
                {!categories.some((c) => c.key === form.category) && form.category && (
                  <option value={form.category}>{form.category}</option>
                )}
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('ae.author')}</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('ae.publishedAt')}</label>
              <input
                type="date"
                value={form.publishedAt}
                onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('ae.readMinutes')}</label>
              <input
                type="number"
                min={1}
                value={form.readMinutes}
                onChange={(e) => setForm({ ...form, readMinutes: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">{t('ae.dek')}</label>
            <textarea
              rows={2}
              value={form.dek}
              onChange={(e) => setForm({ ...form, dek: e.target.value })}
              className="input-field"
            />
            <p className="text-xs text-text-secondary mt-1">{t('ae.dekHint')}</p>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">{t('ae.body')}</label>
            <RichTextEditor
              value={form.body}
              onChange={(html) => setForm({ ...form, body: html })}
              placeholder={t('ae.bodyPlaceholder')}
              minHeight={320}
            />
          </div>
          <div className="mt-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              {t('ae.featured')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              {t('ae.active')}
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-4">{t('ae.images')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(
              [
                { kind: 'cover' as const, value: form.coverImageUrl, label: t('ae.cover'), hint: t('ae.coverHint') },
                { kind: 'thumb' as const, value: form.thumbnailUrl, label: t('ae.thumb'), hint: t('ae.thumbHint') },
              ]
            ).map(({ kind, value, label, hint }) => (
              <div key={kind}>
                <label className="block text-sm font-medium mb-1.5">{label}</label>
                <p className="text-xs text-text-secondary mb-3">{hint}</p>
                {value ? (
                  <div className="relative w-full max-w-xs aspect-video rounded overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getUploadUrl(value)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) =>
                          kind === 'cover' ? { ...prev, coverImageUrl: '' } : { ...prev, thumbnailUrl: '' },
                        )
                      }
                      title={t('ae.remove')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <label className="w-full max-w-xs aspect-video rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent-navy transition-colors">
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">
                      {uploading === kind ? t('ae.uploading') : t('ae.upload')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, kind)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Featured products */}
        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-1">{t('ae.products')}</h2>
          <p className="text-xs text-text-secondary mb-4">{t('ae.productsHint')}</p>

          <div className="relative mb-4 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('ae.productSearch')}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="input-field pl-9"
            />
            {productMatches.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-64 overflow-y-auto">
                {productMatches.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProductIds((prev) => [...prev, p.id]);
                      setProductSearch('');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getUploadUrl(p.imageUrl)} alt="" className="w-8 h-8 object-cover rounded" />
                    <span className="flex-1">{p.name}</span>
                    {p.modelNumber && <span className="text-xs text-text-secondary">{p.modelNumber}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {chosenProducts.length === 0 ? (
            <p className="text-sm text-text-secondary">{t('ae.noProducts')}</p>
          ) : (
            <ul className="divide-y border rounded">
              {chosenProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getUploadUrl(p.imageUrl)} alt="" className="w-10 h-10 object-cover rounded" />
                  <span className="flex-1 font-medium">{p.name}</span>
                  {p.modelNumber && <span className="text-xs text-text-secondary">{p.modelNumber}</span>}
                  <button
                    type="button"
                    onClick={() => moveProduct(i, -1)}
                    disabled={i === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ArrowUpCircle size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProduct(i, 1)}
                    disabled={i === chosenProducts.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ArrowDownCircle size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductIds((prev) => prev.filter((pid) => pid !== p.id))}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? t('ae.saving') : isNew ? t('ae.create') : t('ae.update')}
          </button>
          <Link href="/cms/insight" className="btn-outline">{t('common.cancel')}</Link>
        </div>
      </form>
    </div>
  );
}
