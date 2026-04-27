'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, ExternalLink } from 'lucide-react';
import { useT } from '../_lib/i18n';

interface Translation {
  id?: number;
  faqId?: number;
  locale: string;
  question: string;
  answer: string;
}

interface Faq {
  id: number;
  displayOrder: number;
  isActive: boolean;
  translations: Translation[];
}

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
];

const blankForm = () => ({
  displayOrder: 0,
  isActive: true,
  translations: LOCALES.map((l) => ({ locale: l.code, question: '', answer: '' })),
});

export default function FaqsManagementPage() {
  const { t } = useT();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [activeLocale, setActiveLocale] = useState('en');
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/faqs?all=1');
      if (res.ok) setFaqs(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditing(null);
    setForm(blankForm());
    setActiveLocale('en');
    setShowForm(true);
  }

  function startEdit(f: Faq) {
    setEditing(f);
    const translations = LOCALES.map((l) => {
      const tr = f.translations.find((x) => x.locale === l.code);
      return { locale: l.code, question: tr?.question || '', answer: tr?.answer || '' };
    });
    setForm({ displayOrder: f.displayOrder, isActive: f.isActive, translations });
    setActiveLocale('en');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function updateTranslation(locale: string, field: 'question' | 'answer', value: string) {
    setForm((prev) => ({
      ...prev,
      translations: prev.translations.map((tr) => (tr.locale === locale ? { ...tr, [field]: value } : tr)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const en = form.translations.find((tr) => tr.locale === 'en');
    if (!en?.question.trim()) {
      alert(t('faqs.requireEn'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        displayOrder: form.displayOrder,
        isActive: form.isActive,
        translations: form.translations.filter((tr) => tr.question.trim()),
      };
      if (editing) {
        await fetch(`/api/faqs/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(f: Faq) {
    const en = f.translations.find((tr) => tr.locale === 'en');
    if (!confirm(t('faqs.confirmDelete', { q: en?.question || `#${f.id}` }))) return;
    await fetch(`/api/faqs/${f.id}`, { method: 'DELETE' });
    await load();
  }

  async function toggleActive(f: Faq) {
    await fetch(`/api/faqs/${f.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayOrder: f.displayOrder,
        isActive: !f.isActive,
        translations: [],
      }),
    });
    await load();
  }

  const sorted = useMemo(() => [...faqs].sort((a, b) => a.displayOrder - b.displayOrder), [faqs]);
  const activeCount = faqs.filter((f) => f.isActive).length;
  const translatedLocales = (f: Faq) =>
    new Set(f.translations.filter((tr) => tr.question.trim()).map((tr) => tr.locale));

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-medium text-[#9A8266] tracking-[0.3em] uppercase">
            {t('faqs.headerEyebrow')}
          </span>
          <span className="h-px flex-1 bg-gray-200 max-w-[120px]" />
          <span className="text-[10px] text-gray-400 tracking-[0.25em] uppercase">
            {t('faqs.metaCount', { n: faqs.length, live: activeCount })}
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1
              className="text-4xl md:text-5xl font-medium leading-tight text-gray-900"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              {t('faqs.titlePart1')} <em className="text-[#9A8266] italic font-light">{t('faqs.titlePart2')}</em>
            </h1>
            <p className="text-sm text-gray-500 mt-3 max-w-xl leading-relaxed">
              {t('faqs.intro')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/#faq"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 hover:border-[#9A8266] hover:text-[#9A8266] text-[11px] tracking-[0.2em] uppercase font-medium transition-colors"
            >
              {t('common.preview')}
              <ExternalLink size={12} />
            </a>
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white hover:bg-[#9A8266] text-[11px] tracking-[0.2em] uppercase font-medium transition-colors"
            >
              <Plus size={14} strokeWidth={2} />
              {t('faqs.new')}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white border border-gray-200 px-6 py-16 text-center text-gray-400 text-sm">
          {t('common.loading')}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 px-6 py-20 text-center">
          <HelpEmptyState />
          <button onClick={startNew} className="mt-6 text-[11px] tracking-[0.2em] uppercase text-[#9A8266] hover:underline">
            {t('faqs.empty.add')}
          </button>
        </div>
      ) : (
        <ul className="bg-white border border-gray-200 divide-y divide-gray-100">
          {sorted.map((f, i) => {
            const en = f.translations.find((tr) => tr.locale === 'en');
            const tLocales = translatedLocales(f);
            return (
              <li key={f.id} className="group px-6 py-5 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-start gap-5">
                  {/* Numeral + drag handle */}
                  <div className="flex flex-col items-center gap-1 pt-1 shrink-0 w-12">
                    <span
                      className="font-light text-2xl text-[#9A8266] leading-none"
                      style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] tracking-[0.2em] text-gray-400 uppercase">
                      {t('faqs.label.ord', { n: f.displayOrder })}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3
                        className="text-lg font-medium text-gray-900 leading-snug"
                        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                      >
                        {en?.question || <span className="italic text-gray-400">{t('faqs.untitled')}</span>}
                      </h3>
                      <span
                        className={`shrink-0 text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 font-medium ${
                          f.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {f.isActive ? t('faqs.label.live') : t('faqs.label.hidden')}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
                      {en?.answer || <em className="text-gray-300">{t('faqs.noAnswer')}</em>}
                    </p>

                    {/* Locale chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {LOCALES.map((l) => {
                        const has = tLocales.has(l.code);
                        return (
                          <span
                            key={l.code}
                            className={`text-[10px] tracking-[0.15em] uppercase px-1.5 py-0.5 border font-medium ${
                              has
                                ? 'border-[#9A8266]/40 text-[#7a6750] bg-[#9A8266]/5'
                                : 'border-gray-200 text-gray-300'
                            }`}
                            title={has ? t('faqs.tooltip.has', { label: l.label }) : t('faqs.tooltip.missing', { label: l.label })}
                          >
                            {l.code}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleActive(f)}
                      title={f.isActive ? t('faqs.tooltip.hide') : t('faqs.tooltip.show')}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {f.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      onClick={() => startEdit(f)}
                      title={t('faqs.tooltip.edit')}
                      className="p-2 text-gray-400 hover:text-[#9A8266] hover:bg-[#9A8266]/5 transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(f)}
                      title={t('faqs.tooltip.delete')}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Drawer / overlay form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label={t('common.cancel')}
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px]"
            onClick={closeForm}
          />
          <form
            onSubmit={handleSubmit}
            className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-[slideIn_.35s_cubic-bezier(.16,1,.3,1)]"
            style={{ animation: 'slideIn .35s cubic-bezier(.16,1,.3,1)' }}
          >
            {/* Drawer header */}
            <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-medium text-[#9A8266] tracking-[0.3em] uppercase">
                  {editing ? t('faqs.drawer.editEyebrow') : t('faqs.drawer.newEyebrow')}
                </span>
                <h2
                  className="text-3xl font-medium text-gray-900 mt-1"
                  style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                >
                  {editing ? (
                    <>
                      {t('faqs.drawer.editTitle.a')} <em className="italic text-[#9A8266] font-light">{t('faqs.drawer.editTitle.b')}</em>
                    </>
                  ) : (
                    <>
                      {t('faqs.drawer.newTitle.a')} <em className="italic text-[#9A8266] font-light">{t('faqs.drawer.newTitle.b')}</em>
                    </>
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Settings row */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2 font-medium">
                    {t('faqs.field.order')}
                  </label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-200 focus:border-[#9A8266] focus:outline-none transition-colors text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">{t('faqs.field.orderHint')}</p>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2 font-medium">
                    {t('faqs.field.visibility')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`w-full px-4 py-2.5 border text-sm transition-colors flex items-center justify-between ${
                      form.isActive
                        ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {form.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                      {form.isActive ? t('faqs.toggle.live') : t('faqs.toggle.hidden')}
                    </span>
                    <span className="text-[9px] tracking-[0.2em] uppercase">{t('faqs.toggle.click')}</span>
                  </button>
                </div>
              </div>

              {/* Locale tabs */}
              <div>
                <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-3 font-medium">
                  {t('faqs.field.translations')}
                </label>
                <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-5">
                  {LOCALES.map((l) => {
                    const tr = form.translations.find((x) => x.locale === l.code);
                    const filled = !!tr?.question.trim();
                    const isActive = activeLocale === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => setActiveLocale(l.code)}
                        className={`relative px-4 py-2.5 text-[12px] tracking-wider transition-colors ${
                          isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-medium uppercase">{l.code}</span>
                          <span className="text-[10px] tracking-normal text-gray-400">{l.label}</span>
                          {filled && <span className="w-1.5 h-1.5 rounded-full bg-[#9A8266]" />}
                        </span>
                        {isActive && (
                          <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-[#9A8266]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {LOCALES.map((l) => {
                  if (l.code !== activeLocale) return null;
                  const tr = form.translations.find((x) => x.locale === l.code)!;
                  return (
                    <div key={l.code} className="space-y-4">
                      <div>
                        <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2 font-medium">
                          {t('faqs.field.question')} {l.code === 'en' && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={tr.question}
                          onChange={(e) => updateTranslation(l.code, 'question', e.target.value)}
                          placeholder={
                            l.code === 'en'
                              ? t('faqs.placeholder.questionEn')
                              : t('faqs.placeholder.questionOther', { lang: l.label })
                          }
                          className="w-full px-4 py-3 border border-gray-200 focus:border-[#9A8266] focus:outline-none transition-colors text-base"
                          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2 font-medium">
                          {t('faqs.field.answer')}
                        </label>
                        <textarea
                          rows={6}
                          value={tr.answer}
                          onChange={(e) => updateTranslation(l.code, 'answer', e.target.value)}
                          placeholder={
                            l.code === 'en'
                              ? t('faqs.placeholder.answerEn')
                              : t('faqs.placeholder.answerOther', { lang: l.label })
                          }
                          className="w-full px-4 py-3 border border-gray-200 focus:border-[#9A8266] focus:outline-none transition-colors text-sm leading-relaxed resize-none"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          {t('faqs.field.answerHint')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer footer */}
            <div className="border-t border-gray-100 px-8 py-5 flex items-center justify-between bg-gray-50/50">
              <button
                type="button"
                onClick={closeForm}
                className="text-[11px] tracking-[0.2em] uppercase text-gray-500 hover:text-gray-900 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-7 py-3 bg-gray-900 text-white hover:bg-[#9A8266] text-[11px] tracking-[0.2em] uppercase font-medium transition-colors disabled:opacity-60"
              >
                {saving ? t('common.saving') : editing ? t('common.saveChanges') : t('faqs.publish')}
              </button>
            </div>
          </form>

          <style jsx>{`
            @keyframes slideIn {
              from {
                transform: translateX(40px);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );

  function HelpEmptyState() {
    return (
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 border border-gray-200 flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-300" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
            ?
          </span>
        </div>
        <p
          className="text-2xl text-gray-700 font-medium"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        >
          {t('faqs.empty.title')}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 tracking-wider uppercase">
          {t('faqs.empty.sub')}
        </p>
      </div>
    );
  }
}
