'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Check } from 'lucide-react';
import { useT } from '../../_lib/i18n';

interface CategoryRow {
  id: number;
  key: string;
  displayOrder: number;
  names: Record<string, string>;
  articleCount: number;
}

export default function ArticleCategoriesPage() {
  const { t } = useT();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [newName, setNewName] = useState('');
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch('/api/article-categories');
    if (res.ok) setCategories(await res.json());
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || busy) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/article-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNewName('');
      await fetchData();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || 'Failed to add category');
    }
    setBusy(false);
  }

  async function saveName(cat: CategoryRow) {
    const name = (edits[cat.id] ?? '').trim();
    if (!name || name === (cat.names.en || '')) {
      setEdits((prev) => {
        const next = { ...prev };
        delete next[cat.id];
        return next;
      });
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch(`/api/article-categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || 'Failed to save');
    }
    setEdits((prev) => {
      const next = { ...prev };
      delete next[cat.id];
      return next;
    });
    await fetchData();
    setBusy(false);
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length || busy) return;
    setBusy(true);
    const a = categories[index];
    const b = categories[target];
    // Swap display orders.
    await Promise.all([
      fetch(`/api/article-categories/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder: b.displayOrder }),
      }),
      fetch(`/api/article-categories/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder: a.displayOrder }),
      }),
    ]);
    await fetchData();
    setBusy(false);
  }

  async function handleDelete(cat: CategoryRow) {
    if (cat.articleCount > 0 || busy) return;
    if (!confirm(t('acat.confirmDelete'))) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/article-categories/${cat.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || 'Failed to delete');
    }
    await fetchData();
    setBusy(false);
  }

  return (
    <div>
      <Link href="/cms/insight" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft size={16} /> {t('ae.back')}
      </Link>

      <h1 className="text-2xl font-heading font-bold mb-2">{t('acat.title')}</h1>
      <p className="text-sm text-text-secondary mb-6">{t('acat.keyHint')}</p>

      {/* Add */}
      <form onSubmit={handleAdd} className="cms-card mb-6 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('acat.namePlaceholder')}
          className="input-field flex-1"
        />
        <button type="submit" disabled={busy || !newName.trim()} className="btn-primary text-sm whitespace-nowrap">
          <Plus size={16} className="mr-1" /> {t('acat.add')}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Table */}
      <div className="cms-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">{t('acat.col.name')}</th>
              <th className="text-left py-3">{t('acat.col.key')}</th>
              <th className="text-left py-3">{t('acat.col.articles')}</th>
              <th className="text-left py-3 w-36">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => {
              const editing = edits[cat.id] !== undefined;
              return (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 pe-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editing ? edits[cat.id] : cat.names.en || ''}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                        className="input-field max-w-xs"
                      />
                      {editing && (
                        <button
                          type="button"
                          onClick={() => saveName(cat)}
                          disabled={busy}
                          title={t('acat.save')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-text-secondary font-mono text-xs">{cat.key}</td>
                  <td className="py-2 text-text-secondary">{cat.articleCount}</td>
                  <td className="py-2">
                    <div className="flex gap-1 items-center">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0 || busy}
                        className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                      >
                        <ArrowUpCircle size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === categories.length - 1 || busy}
                        className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                      >
                        <ArrowDownCircle size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        disabled={cat.articleCount > 0 || busy}
                        title={cat.articleCount > 0 ? t('acat.inUseHint') : undefined}
                        className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {categories.length === 0 && <p className="text-center text-text-secondary py-8">{t('acat.empty')}</p>}
      </div>
    </div>
  );
}
