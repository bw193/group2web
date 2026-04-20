'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Upload } from 'lucide-react';
import Link from 'next/link';
import { getUploadUrl, slugify } from '@/lib/utils';

interface Category { id: number; name: string; }
interface Spec { key: string; value: string; locale: string; }

export default function ProductEditPage() {
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
  const [images, setImages] = useState<string[]>([]);
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
          setImages((data.images || []).map((i: any) => i.imageUrl));
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
        setImages((prev) => [...prev, data.url]);
      }
    }
    setUploading(false);
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

  if (loading) return <div className="text-text-secondary">Loading...</div>;

  return (
    <div>
      <Link href="/cms/products" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <h1 className="text-2xl font-heading font-bold mb-6">{isNew ? 'Add Product' : 'Edit Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-4">Basic Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Product Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">URL Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Model Number</label>
              <input type="text" value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input-field">
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">Short Description</label>
            <textarea rows={2} value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="input-field" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">Full Description (HTML)</label>
            <textarea rows={6} value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} className="input-field font-mono text-xs" />
          </div>
          <div className="mt-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Featured Product
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">Tags (comma separated)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="new arrival, best seller" />
          </div>
        </div>

        {/* Specifications */}
        <div className="cms-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Specifications</h2>
            <button type="button" onClick={() => setSpecs([...specs, { key: '', value: '', locale: 'en' }])} className="text-sm text-accent-navy hover:underline flex items-center gap-1">
              <Plus size={14} /> Add Spec
            </button>
          </div>
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="text" placeholder="Key (e.g. Size)" value={spec.key} onChange={(e) => { const s = [...specs]; s[i].key = e.target.value; setSpecs(s); }} className="input-field flex-1" />
              <input type="text" placeholder="Value (e.g. 600x800mm)" value={spec.value} onChange={(e) => { const s = [...specs]; s[i].value = e.target.value; setSpecs(s); }} className="input-field flex-1" />
              <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <X size={16} />
              </button>
            </div>
          ))}
          {specs.length === 0 && <p className="text-sm text-text-secondary">No specifications added.</p>}
        </div>

        {/* Images */}
        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-4">Images</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded overflow-hidden border">
                <img src={getUploadUrl(img)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  &times;
                </button>
              </div>
            ))}
            <label className="w-24 h-24 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent-navy transition-colors">
              <Upload size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Upload</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          {uploading && <p className="text-xs text-text-secondary">Uploading...</p>}
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isNew ? 'Create Product' : 'Update Product'}
          </button>
          <Link href="/cms/products" className="btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
