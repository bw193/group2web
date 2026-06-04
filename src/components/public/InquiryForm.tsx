'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, AlertCircle, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { sendGAEvent } from '@next/third-parties/google';

interface Category {
  id: number;
  name: string;
}

export default function InquiryForm({ categories }: { categories: Category[] }) {
  const t = useTranslations('contact');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Deep-link context from a product card / product page. Read on the client
  // after mount (not via useSearchParams) so the contact page can be statically
  // prerendered instead of bailing into client-only rendering.
  const [productParam, setProductParam] = useState('');
  const [modelParam, setModelParam] = useState('');

  useEffect(() => {
    const read = () => {
      const sp = new URLSearchParams(window.location.search);
      setProductParam(sp.get('product') || '');
      setModelParam(sp.get('model') || '');
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  const selectedProductLabel = useMemo(() => {
    if (productParam && modelParam) return `${modelParam} — ${productParam}`;
    return productParam || modelParam || '';
  }, [productParam, modelParam]);

  const [selectedProduct, setSelectedProduct] = useState({
    name: productParam,
    model: modelParam,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    productInterest: selectedProductLabel,
    message: '',
    honeypot: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    setSelectedProduct({ name: productParam, model: modelParam });
    if (selectedProductLabel) {
      setFormData((prev) => ({ ...prev, productInterest: selectedProductLabel }));
    }
  }, [productParam, modelParam, selectedProductLabel]);

  function clearSelectedProduct() {
    setSelectedProduct({ name: '', model: '' });
    setFormData((prev) => ({ ...prev, productInterest: '' }));
    router.replace(pathname || '/', { scroll: false });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.honeypot) return;

    setStatus('loading');
    try {
      const messageWithReference = selectedProduct.name || selectedProduct.model
        ? `[Inquiring about: ${
            selectedProduct.model && selectedProduct.name
              ? `${selectedProduct.model} — ${selectedProduct.name}`
              : selectedProduct.model || selectedProduct.name
          }]\n\n${formData.message}`
        : formData.message;

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
          message: messageWithReference,
        }),
      });
      if (res.ok) {
        // Fire the GA4 / Google Ads lead-conversion event, then send the user to
        // the dedicated thank-you URL (the Ads "Submit lead form" destination and
        // a clean confirmation). Soft SPA nav — GA4 still tracks the pageview.
        sendGAEvent('event', 'generate_lead', { form: 'contact', value: 1 });
        router.push(`/${locale}/contact/thank-you`);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selected product — simple solid card with model + name */}
      {(selectedProduct.name || selectedProduct.model) && (
        <div className="bg-ink text-cream px-5 py-4 flex items-center gap-4">
          <span className="hidden sm:inline text-[11px] font-body font-semibold text-bronze uppercase tracking-[0.2em]">
            {t('inquiringAbout')}
          </span>
          <div className="flex-1 flex items-baseline flex-wrap gap-x-3 gap-y-1 min-w-0">
            {selectedProduct.model && (
              <span className="font-body text-[12px] font-semibold text-bronze tracking-[0.12em]">
                {selectedProduct.model}
              </span>
            )}
            {selectedProduct.name && (
              <span className="font-display text-[20px] font-normal text-cream leading-snug truncate">
                {selectedProduct.name}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={clearSelectedProduct}
            aria-label={t('clearSelectedProduct')}
            className="shrink-0 text-cream/70 hover:text-cream transition-colors p-1"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
      )}

      <input
        type="text"
        name="website"
        value={formData.honeypot}
        onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Two-column fields on desktop, single column on mobile.
          No inner hairlines — fields are self-contained filled inputs. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field
          label={t('name')}
          required
          value={formData.name}
          onChange={(v) => setFormData({ ...formData, name: v })}
        />
        <Field
          label={t('email')}
          type="email"
          required
          value={formData.email}
          onChange={(v) => setFormData({ ...formData, email: v })}
        />
        <Field
          label={`${t('phone')} (${t('optional')})`}
          type="tel"
          value={formData.phone}
          onChange={(v) => setFormData({ ...formData, phone: v })}
        />
        <Field
          label={t('company')}
          value={formData.company}
          onChange={(v) => setFormData({ ...formData, company: v })}
        />
        <Field
          label={t('country')}
          value={formData.country}
          onChange={(v) => setFormData({ ...formData, country: v })}
        />
        <SelectField
          label={t('productInterest')}
          placeholder={t('selectCategory')}
          value={formData.productInterest}
          onChange={(v) => setFormData({ ...formData, productInterest: v })}
          options={categories.map((c) => ({ value: c.name, label: c.name }))}
          extraOption={
            selectedProductLabel && !categories.some((c) => c.name === selectedProductLabel)
              ? { value: selectedProductLabel, label: selectedProductLabel }
              : undefined
          }
        />
      </div>

      {/* Message */}
      <div>
        <label className="block">
          <span className="block text-[13px] font-body font-medium text-ink mb-2">
            {t('message')} <span className="text-bronze">*</span>
          </span>
          <textarea
            required
            rows={6}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-sand border border-transparent hover:border-warm-border focus:border-ink px-4 py-3 text-[15px] font-body text-ink placeholder:text-ink-light focus:outline-none resize-y leading-[1.6] transition-colors"
            placeholder={
              selectedProduct.name
                ? t('placeholderWithProduct', { product: selectedProduct.name })
                : t('placeholderGeneral')
            }
          />
        </label>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-[14px] font-body px-4 py-3">
          <AlertCircle size={16} />
          {t('error')}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary h-14 px-10 text-[12px] disabled:opacity-50 group"
        >
          <span>{status === 'loading' ? t('sending') : t('sendButton')}</span>
          <ArrowRight
            size={16}
            strokeWidth={2}
            className="ms-3 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100"
          />
        </button>
        <p className="mt-3 text-[13px] font-body text-ink-mid">
          {t('replyTime')}
        </p>
      </div>
    </form>
  );
}

/* ============================================================
   Field — filled input with readable label, proper size, strong focus
   ============================================================ */
function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-body font-medium text-ink mb-2">
        {label} {required && <span className="text-bronze">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 bg-sand border border-transparent hover:border-warm-border focus:border-ink px-4 text-[15px] font-body text-ink placeholder:text-ink-light focus:outline-none transition-colors"
      />
    </label>
  );
}

function SelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
  extraOption,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  extraOption?: { value: string; label: string };
}) {
  return (
    <label className="block relative">
      <span className="block text-[13px] font-body font-medium text-ink mb-2">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 bg-sand border border-transparent hover:border-warm-border focus:border-ink px-4 pe-10 text-[15px] font-body text-ink focus:outline-none appearance-none cursor-pointer transition-colors"
      >
        <option value="">{placeholder}</option>
        {extraOption && <option value={extraOption.value}>{extraOption.label}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute end-4 bottom-4 text-ink-mid text-[12px]"
      >
        ▾
      </span>
    </label>
  );
}
