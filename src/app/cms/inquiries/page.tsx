'use client';

import { useState, useEffect } from 'react';
import { Mail, MailOpen, Trash2, Download, MessageCircle } from 'lucide-react';
import { useT } from '../_lib/i18n';

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  productInterest: string | null;
  message: string;
  isRead: boolean;
  isReplied: boolean;
  createdAt: string;
}

export default function InquiriesPage() {
  const { t, lang } = useT();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<Inquiry | null>(null);

  useEffect(() => { fetchInquiries(); }, []);

  async function fetchInquiries() {
    const res = await fetch('/api/inquiries');
    if (res.ok) setInquiries(await res.json());
  }

  async function markRead(id: number, isRead: boolean) {
    await fetch(`/api/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead }),
    });
    fetchInquiries();
  }

  async function markReplied(id: number, isReplied: boolean) {
    await fetch(`/api/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isReplied }),
    });
    fetchInquiries();
  }

  async function handleDelete(id: number) {
    if (!confirm(t('inq.confirmDelete'))) return;
    await fetch(`/api/inquiries/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    fetchInquiries();
  }

  function exportCSV() {
    window.location.href = '/api/inquiries/export';
  }

  const dateLocale = lang === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('inq.title')}</h1>
        <button onClick={exportCSV} className="btn-outline text-sm">
          <Download size={16} className="mr-1" /> {t('inq.export')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 cms-card max-h-[70vh] overflow-y-auto">
          {inquiries.length === 0 ? (
            <p className="text-text-secondary text-sm py-4">{t('inq.empty')}</p>
          ) : (
            <div className="space-y-1">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  onClick={() => { setSelected(inq); if (!inq.isRead) markRead(inq.id, true); }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selected?.id === inq.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  } ${!inq.isRead ? 'border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${!inq.isRead ? 'font-semibold' : ''}`}>{inq.name}</span>
                    <span className="text-xs text-text-secondary">
                      {new Date(inq.createdAt).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{inq.email}</p>
                  <p className="text-xs text-text-secondary truncate mt-1">{inq.message}</p>
                  <div className="flex gap-1 mt-1">
                    {inq.isReplied && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{t('inq.replied')}</span>
                    )}
                    {inq.productInterest && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{inq.productInterest}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="cms-card">
          {selected ? (
            <div>
              <h3 className="font-semibold mb-3">{selected.name}</h3>
              <div className="space-y-2 text-sm mb-4">
                <p><span className="text-text-secondary">{t('inq.label.email')}</span> <a href={`mailto:${selected.email}`} className="text-accent-navy">{selected.email}</a></p>
                {selected.phone && <p><span className="text-text-secondary">{t('inq.label.phone')}</span> {selected.phone}</p>}
                {selected.company && <p><span className="text-text-secondary">{t('inq.label.company')}</span> {selected.company}</p>}
                {selected.country && <p><span className="text-text-secondary">{t('inq.label.country')}</span> {selected.country}</p>}
                {selected.productInterest && <p><span className="text-text-secondary">{t('inq.label.product')}</span> {selected.productInterest}</p>}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => markReplied(selected.id, !selected.isReplied)}
                  className={`text-xs px-3 py-1.5 rounded border ${selected.isReplied ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200'}`}
                >
                  <MessageCircle size={12} className="inline mr-1" />
                  {selected.isReplied ? t('inq.replied') : t('inq.markReplied')}
                </button>
                <button
                  onClick={() => markRead(selected.id, !selected.isRead)}
                  className="text-xs px-3 py-1.5 rounded border border-gray-200"
                >
                  {selected.isRead ? <MailOpen size={12} className="inline mr-1" /> : <Mail size={12} className="inline mr-1" />}
                  {selected.isRead ? t('inq.markUnread') : t('inq.markRead')}
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="text-xs px-3 py-1.5 rounded border border-red-200 text-red-600"
                >
                  <Trash2 size={12} className="inline mr-1" /> {t('common.delete')}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">{t('inq.selectHint')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
