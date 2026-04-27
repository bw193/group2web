'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Upload, Star, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import Link from 'next/link';
import { getUploadUrl, slugify } from '@/lib/utils';
import { useT } from '../../_lib/i18n';

interface Category { id: number; name: string; }
interface Spec { key: string; value: string; locale: string; }
interface ProductImage { imageUrl: string; isPrimary: boolean; }

export default function ProductEditPage() {
  const { t } = useT();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    categoryId: '',
    modelNumber: '',
    isFeatured: false,
    isActive: true,
    tags: '',
    name: '',
    slug: '',
    shortDescription: '',
    fullDescription: '',
  });
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/categories?locale=en').then((r) => r.json()).then(setCategories).catch(() => {});

    if (!isNew) {
      fetch(`/api/products/${id}?locale=en`)
        .then((r) => r.json())
        .then((data) => {
          const enTrans = data.translations?.find((t: any) => t.locale === 'en') || data.translations?.[0];
          setForm({
            categoryId: data.categoryId ? String(data.categoryId) : '',
            modelNumber: data.modelNumber || '',
            isFeatured: data.isFeatured || false,
            isActive: data.isActive !== false,
            tags: (data.tags || []).join(', '),
            name: enTrans?.name || '',
            slug: enTrans?.slug || '',
            shortDescription: enTrans?.shortDescription || '',
            fullDescription: enTrans?.fullDescription || '',
          });
          setSpecs((data.specifications || []).filter((s: any) => s.locale === 'en').map((s: any) => ({ key: s.specKey, value: s.specValue, locale: 'en' })));
          const loadedImages: ProductImage[] = (data.images || []).map((i: any) => ({ imageUrl: i.imageUrl, isPrimary: !!i.isPrimary }));
          if (loadedImages.length > 0 && !loadedImages.some((img) => img.isPrimary)) {
            loadedImages[0].isPrimary = true;
          }
          setImages(loadedImages);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'products');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setImages((prev) => [
          ...prev,
          { imageUrl: data.url, isPrimary: prev.length === 0 },
        ]);
      }
    }
    setUploading(false);
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, j) => j !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }

  function setPrimary(index: number) {
    setImages((prev) => prev.map((img, j) => ({ ...img, isPrimary: j === index })));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((prev) => {
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

    const payload = {
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      modelNumber: form.modelNumber || null,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      translations: [{
        locale: 'en',
        name: form.name,
        slug: form.slug || slugify(form.name),
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
      }],
      specifications: specs.map((s) => ({ locale: 'en', key: s.key, value: s.value })),
      images: images.map((img, i) => ({
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary,
        displayOrder: i,
      })),
    };

    const url = isNew ? '/api/products' : `/api/products/${id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/cms/products');
    }
    setSaving(false);
  }

  if (loading) return <div className="text-text-secondary">{t('common.loading')}</div>;

  return (
    <div>
      <Link href="/cms/products" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft size={16} /> {t('pe.back')}
      </Link>

      <h1 className="text-2xl font-heading font-bold mb-6">{isNew ? t('pe.titleNew') : t('pe.titleEdit')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-4">{t('pe.basicInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('pe.name')}</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('pe.slug')}</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('pe.model')}</label>
              <input type="text" value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('pe.category')}</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input-field">
                <option value="">{t('pe.selectCategory')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">{t('pe.shortDesc')}</label>
            <textarea rows={2} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="input-field" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">{t('pe.fullDesc')}</label>
            <textarea rows={6} value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} className="input-field font-mono text-xs" />
          </div>
          <div className="mt-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              {t('pe.featured')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              {t('pe.active')}
            </label>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">{t('pe.tags')}</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder={t('pe.tagsPlaceholder')} />
          </div>
        </div>

        {/* Specifications */}
        <div className="cms-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('pe.specs')}</h2>
            <button type="button" onClick={() => setSpecs([...specs, { key: '', value: '', locale: 'en' }])} className="text-sm text-accent-navy hover:underline flex items-center gap-1">
              <Plus size={14} /> {t('pe.addSpec')}
            </button>
          </div>
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" placeholder={t('pe.specKey')} value={spec.key} onChange={(e) => { const s = [...specs]; s[i].key = e.target.value; setSpecs(s); }} className="input-field flex-1" />
              <input type="text" placeholder={t('pe.specValue')} value={spec.value} onChange={(e) => { const s = [...specs]; s[i].value = e.target.value; setSpecs(s); }} className="input-field flex-1" />
              <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <X size={16} />
              </button>
            </div>
          ))}
          {specs.length === 0 && <p className="text-sm text-text-secondary">{t('pe.noSpecs')}</p>}
        </div>

        {/* Images */}
        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-1">{t('pe.images')}</h2>
          <p className="text-xs text-text-secondary mb-4">
            {t('pe.imagesHint')}
          </p>
          <div className="flex flex-wrap gap-4 mb-4">
            {images.map((img, i) => (
              <div
                key={i}
                className={`relative w-28 h-28 rounded overflow-hidden border ${
                  img.isPrimary ? 'ring-2 ring-amber-400 border-amber-400' : ''
                }`}
              >
                <img src={getUploadUrl(img.imageUrl)} alt="" className="w-full h-full object-cover" />

                {img.isPrimary && (
                  <span className="absolute top-1 left-1 bg-amber-400 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    {t('pe.main')}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  title={t('pe.tooltip.remove')}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  &times;
                </button>

                <div className="absolute bottom-0 inset-x-0 bg-black/55 text-white flex items-center justify-between px-1 py-1">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    title={t('pe.tooltip.moveLeft')}
                    className="disabled:opacity-30 hover:text-amber-300"
                  >
                    <ArrowLeftCircle size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    disabled={img.isPrimary}
                    title={t('pe.tooltip.setMain')}
                    className={`${img.isPrimary ? 'text-amber-300' : 'hover:text-amber-300'} disabled:cursor-default`}
                  >
                    <Star size={16} fill={img.isPrimary ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === images.length - 1}
                    title={t('pe.tooltip.moveRight')}
                    className="disabled:opacity-30 hover:text-amber-300"
                  >
                    <ArrowRightCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
            <label className="w-28 h-28 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent-navy transition-colors">
              <Upload size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">{t('pe.upload')}</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          {uploading && <p className="text-xs text-text-secondary">{t('pe.uploading')}</p>}
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? t('pe.creating') : isNew ? t('pe.create') : t('pe.updateBtn')}
          </button>
          <Link href="/cms/products" className="btn-outline">{t('common.cancel')}</Link>
        </div>
      </form>
    </div>
  );
}
