'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, AlertCircle } from 'lucide-react';
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
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          country: '',
          productInterest: '',
          message: '',
          honeypot: '',
        });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="border-t border-warm-border pt-14">
        <p className="kicker-plain mb-6">
          <span className="text-bronze mr-3">—</span>
          Received
        </p>
        <p className="font-display text-4xl md:text-5xl font-light text-ink leading-[1.1] tracking-[-0.015em] mb-6">
          Thank you.
        </p>
        <p className="text-[16px] font-body font-light text-ink-mid leading-[1.85] max-w-md">
          {t('success')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-warm-border">
      <input
        type="text"
        name="website"
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-warm-border">
        <Field label={`${t('name')} *`} required value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />
        <Field label={`${t('email')} *`} type="email" required value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} className="md:border-l md:border-warm-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-warm-border">
        <Field label={`${t('phone')} (${t('optional')})`} type="tel" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
        <Field label={t('company')} value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} className="md:border-l md:border-warm-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-warm-border">
        <Field label={t('country')} value={formData.country} onChange={(v) => setFormData({ ...formData, country: v })} />
        <SelectField
          label={t('productInterest')}
          value={formData.productInterest}
          onChange={(v) => setFormData({ ...formData, productInterest: v })}
          options={categories.map((c) => ({ value: c.name, label: c.name }))}
          className="md:border-l md:border-warm-border"
        />
      </div>

      <div className="border-b border-warm-border">
        <label className="block px-0 py-6">
          <span className="block text-[10px] font-body font-medium text-ink-mid tracking-[0.26em] uppercase mb-4">
            {t('message')} *
          </span>
          <textarea
            required
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-transparent border-0 text-[16px] font-body font-light text-ink placeholder:text-ink-light focus:outline-none resize-none leading-relaxed"
            placeholder="Tell us about volumes, dimensions, timeline, or certifications you need…"
          />
        </label>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-700 text-sm font-body py-4 border-b border-warm-border">
          <AlertCircle size={15} />
          {t('error')}
        </div>
      )}

      <div className="pt-10">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary disabled:opacity-50 group"
        >
          <span>{status === 'loading' ? '…' : t('submit')}</span>
          <ArrowRight size={14} strokeWidth={1.5} className="ml-3 transition-transform duration-500 group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}

/* ---------- Field subcomponents ---------- */

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block py-6 group ${className}`}>
      <span className="block text-[10px] font-body font-medium text-ink-mid tracking-[0.26em] uppercase mb-4">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-0 text-[16px] font-body font-light text-ink placeholder:text-ink-light focus:outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <label className={`block py-6 ${className}`}>
      <span className="block text-[10px] font-body font-medium text-ink-mid tracking-[0.26em] uppercase mb-4">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-0 text-[16px] font-body font-light text-ink focus:outline-none appearance-none cursor-pointer"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
