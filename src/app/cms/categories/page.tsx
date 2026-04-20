'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { slugify } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  displayOrder: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', parentId: '', displayOrder: 0 });

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    const res = await fetch('/api/categories?locale=en');
    if (res.ok) setCategories(await res.json());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      parentId: form.parentId ? parseInt(form.parentId) : null,
      displayOrder: form.displayOrder,
      translations: [{ locale: 'en', name: form.name, slug: form.slug || slugify(form.name) }],
    };

    if (editing) {
      await fetch(`/api/categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    fetchCategories();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchCategories();
  }

  function startEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, parentId: cat.parentId ? String(cat.parentId) : '', displayOrder: cat.displayOrder });
    setShowForm(true);
  }

  function resetForm() {
    setEditing(null);
    setShowForm(false);
    setForm({ name: '', slug: '', parentId: '', displayOrder: 0 });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Categories</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">
          <Plus size={16} className="mr-1" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="cms-card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Category Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">URL Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Parent Category</label>
                <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="input-field">
                  <option value="">None (top level)</option>
                  {categories.filter((c) => c.id !== editing?.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Display Order</label>
                <input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} className="input-field" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm">{editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={resetForm} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="cms-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Slug</th>
              <th className="text-left py-3">Order</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b last:border-0">
                <td className="py-2.5 font-medium">{cat.name}</td>
                <td className="py-2.5 text-text-secondary">{cat.slug}</td>
                <td className="py-2.5 text-text-secondary">{cat.displayOrder}</td>
                <td className="py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(cat)} className="p-2 hover:bg-gray-100 rounded"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && <p className="text-center text-text-secondary py-4">No categories yet.</p>}
      </div>
    </div>
  );
}
