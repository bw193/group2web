'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';

interface Banner {
  id: number;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  ctaLink: string | null;
  title?: string;
  subtitle?: string;
  ctaText?: string;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ imageUrl: '', displayOrder: 0, isActive: true, ctaLink: '', title: '', subtitle: '', ctaText: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchBanners(); }, []);

  async function fetchBanners() {
    const res = await fetch('/api/banners?locale=en');
    if (res.ok) setBanners(await res.json());
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'banners');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      setForm({ ...form, imageUrl: data.url });
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      imageUrl: form.imageUrl,
      displayOrder: form.displayOrder,
      isActive: form.isActive,
      ctaLink: form.ctaLink || null,
      translations: [{ locale: 'en', title: form.title, subtitle: form.subtitle, ctaText: form.ctaText }],
    };

    if (editing) {
      await fetch(`/api/banners/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    fetchBanners();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this banner?')) return;
    await fetch(`/api/banners/${id}`, { method: 'DELETE' });
    fetchBanners();
  }

  function startEdit(banner: Banner) {
    setEditing(banner);
    setForm({
      imageUrl: banner.imageUrl,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      ctaLink: banner.ctaLink || '',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      ctaText: banner.ctaText || '',
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditing(null);
    setShowForm(false);
    setForm({ imageUrl: '', displayOrder: 0, isActive: true, ctaLink: '', title: '', subtitle: '', ctaText: '' });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Banner Management</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
          <Plus size={16} className="mr-1" /> Add Banner
        </button>
      </div>

      {showForm && (
        <div className="cms-card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Banner' : 'New Banner'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Banner Image *</label>
              <input type="file" accept="image/*" onChange={handleUpload} className="text-sm" />
              {uploading && <p className="text-xs text-text-secondary mt-1">Uploading...</p>}
              {form.imageUrl && (
                <img src={getUploadUrl(form.imageUrl)} alt="Preview" className="mt-2 h-32 object-cover rounded" />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Subtitle</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">CTA Text</label>
                <input type="text" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">CTA Link</label>
                <input type="text" value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} className="input-field" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm">{editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={resetForm} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className="cms-card flex items-center gap-4">
            <img src={getUploadUrl(banner.imageUrl)} alt="" className="w-24 h-16 object-cover rounded" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{banner.title || 'Untitled Banner'}</p>
              <p className="text-xs text-text-secondary">{banner.subtitle || 'No subtitle'}</p>
            </div>
            <span className="text-xs text-text-secondary">Order: {banner.displayOrder}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {banner.isActive ? 'Active' : 'Inactive'}
            </span>
            <div className="flex gap-1">
              <button onClick={() => startEdit(banner)} className="p-2 hover:bg-gray-100 rounded"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(banner.id)} className="p-2 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="text-text-secondary text-sm">No banners yet.</p>}
      </div>
    </div>
  );
}
