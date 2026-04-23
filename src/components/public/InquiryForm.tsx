'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface Category {
  id: number;
  name: string;
}

export default function InquiryForm({ categories }: { categories: Category[] }) {
  const t = useTranslations('contact');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Deep-link context from a product card / product page.
  const productParam = searchParams.get('product') || '';
  const modelParam = searchParams.get('model') || '';

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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
      <div className="bg-sand p-8 md:p-10">
        <div className="flex items-center gap-3 text-bronze mb-4">
          <CheckCircle2 size={24} strokeWidth={1.75} />
          <span className="text-[13px] font-body font-semibold uppercase tracking-[0.15em]">
            Inquiry received
          </span>
        </div>
        <h3 className="font-display text-3xl md:text-4xl font-normal text-ink leading-tight mb-3">
          Thank you.
        </h3>
        <p className="text-[16px] font-body text-ink leading-[1.6] max-w-md">
          {t('success')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selected product — simple solid card with model + name */}
      {(selectedProduct.name || selectedProduct.model) && (
        <div className="bg-ink text-cream px-5 py-4 flex items-center gap-4">
          <span className="hidden sm:inline text-[11px] font-body font-semibold text-bronze uppercase tracking-[0.2em]">
            Inquiring about
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
            aria-label="Clear selected product"
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
          label="Your name"
          required
          value={formData.name}
          onChange={(v) => setFormData({ ...formData, name: v })}
        />
        <Field
          label="Email"
          type="email"
          required
          value={formData.email}
          onChange={(v) => setFormData({ ...formData, email: v })}
        />
        <Field
          label="Phone (optional)"
          type="tel"
          value={formData.phone}
          onChange={(v) => setFormData({ ...formData, phone: v })}
        />
        <Field
          label="Company"
          value={formData.company}
          onChange={(v) => setFormData({ ...formData, company: v })}
        />
        <Field
          label="Country"
          value={formData.country}
          onChange={(v) => setFormData({ ...formData, country: v })}
        />
        <SelectField
          label="Product category"
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
            Your message <span className="text-bronze">*</span>
          </span>
          <textarea
            required
            rows={6}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-sand border border-transparent hover:border-warm-border focus:border-ink px-4 py-3 text-[15px] font-body text-ink placeholder:text-ink-light focus:outline-none resize-y leading-[1.6] transition-colors"
            placeholder={
              selectedProduct.name
                ? `Quantities, finishes, lead time you're targeting for the ${selectedProduct.name}…`
                : 'Tell us about volumes, dimensions, timeline, or certifications you need…'
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
          <span>{status === 'loading' ? 'Sending…' : 'Send inquiry'}</span>
          <ArrowRight
            size={16}
            strokeWidth={2}
            className="ml-3 transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>
        <p className="mt-3 text-[13px] font-body text-ink-mid">
          We&rsquo;ll reply within one business day.
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
  value,
  onChange,
  options,
  extraOption,
}: {
  label: string;
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
        className="w-full h-12 bg-sand border border-transparent hover:border-warm-border focus:border-ink px-4 pr-10 text-[15px] font-body text-ink focus:outline-none appearance-none cursor-pointer transition-colors"
      >
        <option value="">Select a category</option>
        {extraOption && <option value={extraOption.value}>{extraOption.label}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 bottom-4 text-ink-mid text-[12px]"
      >
        ▾
      </span>
    </label>
  );
}
