'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Category {
  id: number;
  name: string;
}

export default function InquiryForm({ categories }: { categories: Category[] }) {
  const t = useTranslations('contact');
  const searchParams = useSearchParams();
  const prefilledProduct = searchParams.get('product') || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    productInterest: prefilledProduct,
    message: '',
    honeypot: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (prefilledProduct) {
      setFormData((prev) => ({ ...prev, productInterest: prefilledProduct }));
    }
  }, [prefilledProduct]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.honeypot) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          country: formData.country,
          productInterest: formData.productInterest,
          message: formData.message,
        }),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', company: '', country: '', productInterest: '', message: '', honeypot: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 border border-bronze/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-bronze" size={28} />
        </div>
        <p className="text-2xl font-display font-medium text-ink mb-2">{t('success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <input
        type="text"
        name="website"
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-3">
            {t('name')} *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-3">
            {t('email')} *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-3">
            {t('phone')} <span className="text-ink-light/60 normal-case tracking-normal">({t('optional')})</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-3">
            {t('company')}
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-3">
            {t('country')}
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-3">
            {t('productInterest')}
          </label>
          <select
            value={formData.productInterest}
            onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
            className="input-field"
          >
            <option value="">--</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-body font-medium text-ink-light tracking-[0.15em] uppercase mb-3">
          {t('message')} *
        </label>
        <textarea
          required
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="input-field resize-none"
        />
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-700 text-sm font-body">
          <AlertCircle size={15} />
          {t('error')}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full md:w-auto disabled:opacity-50 uppercase tracking-[0.12em] group"
      >
        <span>{status === 'loading' ? '...' : t('submit')}</span>
        <ArrowRight size={15} className="ml-3 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </form>
  );
}
