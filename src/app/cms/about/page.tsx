'use client';

import { useEffect, useState } from 'react';
import { Save, Upload, Trash2, Image as ImageIcon, Building2, Award, Plus, ExternalLink } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';
import { useT } from '../_lib/i18n';

interface GalleryItem {
  id: number;
  imageUrl: string;
  imageType: string;
  displayOrder: number;
}

const FACILITY_SLOTS = 4; // home page facility gallery shows up to 4

export default function AboutManagementPage() {
  const { t } = useT();
  // Text content
  const [content, setContent] = useState('');
  const [factorySize, setFactorySize] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [annualCapacity, setAnnualCapacity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Galleries
  const [facility, setFacility] = useState<GalleryItem[]>([]);
  const [certs, setCerts] = useState<GalleryItem[]>([]);
  const [uploadingType, setUploadingType] = useState<'factory' | 'certification' | null>(null);

  useEffect(() => {
    fetch('/api/about')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setContent(data.content || '');
          setFactorySize(data.factorySize || '');
          setEmployeeCount(data.employeeCount || '');
          setAnnualCapacity(data.annualCapacity || '');
        }
      })
      .catch(() => {});
    void loadGalleries();
  }, []);

  async function loadGalleries() {
    const [f, c] = await Promise.all([
      fetch('/api/about/gallery?type=factory').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/about/gallery?type=certification').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]);
    setFacility(f);
    setCerts(c);
  }

  async function handleSave() {
    setSaving(true);
    await fetch('/api/about', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, factorySize, employeeCount, annualCapacity, locale: 'en' }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleUpload(file: File, type: 'factory' | 'certification', nextOrder: number) {
    setUploadingType(type);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', type === 'factory' ? 'facility' : 'certifications');
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!upRes.ok) {
        alert(t('about.uploadFailed'));
        return;
      }
      const { url } = await upRes.json();
      await fetch('/api/about/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url, imageType: type, displayOrder: nextOrder }),
      });
      await loadGalleries();
    } finally {
      setUploadingType(null);
    }
  }

  async function deleteImage(id: number, type: 'factory' | 'certification') {
    const msg = type === 'factory' ? t('about.confirmDeleteFacility') : t('about.confirmDeleteCert');
    if (!confirm(msg)) return;
    await fetch(`/api/about/gallery/${id}`, { method: 'DELETE' });
    await loadGalleries();
  }

  async function reorder(item: GalleryItem, delta: number) {
    await fetch(`/api/about/gallery/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayOrder: item.displayOrder + delta }),
    });
    await loadGalleries();
  }

  return (
    <div className="max-w-[1280px] mx-auto space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-medium text-[#9A8266] tracking-[0.3em] uppercase">
            {t('about.eyebrow')}
          </span>
          <span className="h-px flex-1 bg-gray-200 max-w-[120px]" />
          <span className="text-[10px] text-gray-400 tracking-[0.25em] uppercase">
            {t('about.metaSub')}
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1
              className="text-4xl md:text-5xl font-medium leading-tight text-gray-900"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              {t('about.titlePart1')} <em className="text-[#9A8266] italic font-light">{t('about.titlePart2')}</em>
            </h1>
            <p className="text-sm text-gray-500 mt-3 max-w-xl leading-relaxed">
              {t('about.intro')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 hover:border-[#9A8266] hover:text-[#9A8266] text-[11px] tracking-[0.2em] uppercase font-medium transition-colors"
            >
              {t('about.preview')}
              <ExternalLink size={12} />
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white hover:bg-[#9A8266] text-[11px] tracking-[0.2em] uppercase font-medium transition-colors disabled:opacity-60"
            >
              <Save size={14} strokeWidth={2} />
              {saving ? t('common.saving') : saved ? t('about.saved') : t('about.saveText')}
            </button>
          </div>
        </div>
      </div>

      {/* === Facility Gallery — fixed 4-slot ===================================== */}
      <Section
        eyebrow="03"
        title={t('about.facility.title')}
        emphasis={t('about.facility.emphasis')}
        description={t('about.facility.desc')}
        icon={Building2}
        meta={t('about.facility.meta', { n: facility.length, total: FACILITY_SLOTS })}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: FACILITY_SLOTS }).map((_, i) => {
            const item = facility[i];
            return (
              <SlotCard
                key={i}
                index={i}
                item={item}
                kind="factory"
                onUpload={(f) => handleUpload(f, 'factory', (facility[facility.length - 1]?.displayOrder ?? -1) + 1)}
                onDelete={(id) => deleteImage(id, 'factory')}
                uploading={uploadingType === 'factory'}
              />
            );
          })}
        </div>
        {facility.length >= FACILITY_SLOTS && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 mt-4">
            {t('about.facility.full')}
          </p>
        )}
      </Section>

      {/* === Certification Gallery — dynamic count ============================== */}
      <Section
        eyebrow="04"
        title={t('about.cert.title')}
        emphasis={t('about.cert.emphasis')}
        description={t('about.cert.desc')}
        icon={Award}
        meta={t(certs.length === 1 ? 'about.cert.metaOne' : 'about.cert.metaMany', { n: certs.length })}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {certs.map((c, i) => (
            <CertCard
              key={c.id}
              index={i}
              item={c}
              total={certs.length}
              onDelete={() => deleteImage(c.id, 'certification')}
              onReorder={(delta) => reorder(c, delta)}
            />
          ))}
          <CertUploader
            uploading={uploadingType === 'certification'}
            nextOrder={(certs[certs.length - 1]?.displayOrder ?? -1) + 1}
            onUpload={(f, ord) => handleUpload(f, 'certification', ord)}
          />
        </div>
        {certs.length === 0 && (
          <p className="text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 mt-4">
            {t('about.cert.empty')}
          </p>
        )}
      </Section>

      {/* === Text content ========================================================= */}
      <Section
        eyebrow="01"
        title={t('about.intro.title')}
        emphasis={t('about.intro.emphasis')}
        description={t('about.intro.desc')}
        icon={ImageIcon}
        meta={t('about.intro.meta')}
      >
        <textarea
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 focus:border-[#9A8266] focus:outline-none transition-colors text-xs font-mono leading-relaxed resize-y"
          placeholder={t('about.intro.placeholder')}
        />
      </Section>

      <Section
        eyebrow="02"
        title={t('about.stats.title')}
        emphasis={t('about.stats.emphasis')}
        description={t('about.stats.desc')}
        icon={Building2}
        meta={t('about.stats.meta')}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatField label={t('about.stats.facilitySize')} value={factorySize} onChange={setFactorySize} placeholder="35,000㎡" />
          <StatField label={t('about.stats.employees')} value={employeeCount} onChange={setEmployeeCount} placeholder="200+" />
          <StatField label={t('about.stats.capacity')} value={annualCapacity} onChange={setAnnualCapacity} placeholder="500,000 units" />
        </div>
      </Section>
    </div>
  );
}

/* ---------- Sub components ------------------------------------------------ */

function Section({
  eyebrow,
  title,
  emphasis,
  description,
  icon: Icon,
  meta,
  children,
}: {
  eyebrow: string;
  title: string;
  emphasis: string;
  description: string;
  icon: typeof Building2;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200">
      <div className="flex items-start justify-between gap-6 px-6 py-5 border-b border-gray-100">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-10 h-10 border border-gray-200 flex items-center justify-center shrink-0 mt-1">
            <Icon size={16} strokeWidth={1.5} className="text-[#9A8266]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#9A8266]">{eyebrow}</span>
              <span className="w-6 h-px bg-gray-200" />
              <span className="text-[9px] tracking-[0.25em] text-gray-400 uppercase">{meta}</span>
            </div>
            <h2
              className="text-2xl font-medium text-gray-900 leading-tight"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              {title}{' '}
              <em className="italic text-[#9A8266] font-light">{emphasis}</em>
            </h2>
            <p className="text-[12px] text-gray-500 mt-1.5 max-w-2xl leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function SlotCard({
  index,
  item,
  kind,
  onUpload,
  onDelete,
  uploading,
}: {
  index: number;
  item?: GalleryItem;
  kind: 'factory' | 'certification';
  onUpload: (f: File) => void;
  onDelete: (id: number) => void;
  uploading: boolean;
}) {
  const { t } = useT();
  if (item) {
    return (
      <div className="group relative aspect-[4/5] bg-gray-50 border border-gray-200 hover:border-[#9A8266] transition-colors overflow-hidden">
        <img
          src={getUploadUrl(item.imageUrl)}
          alt=""
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <span className="absolute top-2 left-2 text-[9px] tracking-[0.2em] text-white bg-black/40 backdrop-blur-sm px-1.5 py-0.5">
          {String(index + 1).padStart(2, '0')}
        </span>
        <button
          onClick={() => onDelete(item.id)}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-red-600 hover:text-white text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          title={t('about.tooltip.delete')}
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  }
  return (
    <label className="group relative aspect-[4/5] border border-dashed border-gray-300 hover:border-[#9A8266] hover:bg-[#9A8266]/[0.02] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
      <span className="text-[9px] tracking-[0.25em] text-gray-300 uppercase absolute top-2 left-2">
        {t('about.slot.label', { n: String(index + 1).padStart(2, '0') })}
      </span>
      <Upload size={20} className="text-gray-300 group-hover:text-[#9A8266] transition-colors" strokeWidth={1.5} />
      <span className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">
        {uploading ? t('pe.uploading') : t('about.addPhoto')}
      </span>
      <span className="absolute inset-x-4 bottom-3 h-px bg-gray-200 group-hover:bg-[#9A8266] transition-colors" />
    </label>
  );
}

function CertCard({
  index,
  item,
  total,
  onDelete,
  onReorder,
}: {
  index: number;
  item: GalleryItem;
  total: number;
  onDelete: () => void;
  onReorder: (delta: number) => void;
}) {
  const { t } = useT();
  return (
    <div className="group relative aspect-square bg-gray-50 border border-gray-200 hover:border-[#9A8266] transition-colors overflow-hidden">
      <img src={getUploadUrl(item.imageUrl)} alt="" className="w-full h-full object-contain p-3" />
      <span className="absolute top-1.5 left-1.5 text-[9px] tracking-[0.15em] text-gray-500 font-mono">
        {String(index + 1).padStart(String(total).length, '0')}
        <span className="opacity-40 ml-1">/ {total}</span>
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-100 flex opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
        <button
          type="button"
          onClick={() => onReorder(-1)}
          className="flex-1 py-1.5 text-[10px] text-gray-500 hover:text-[#9A8266] hover:bg-gray-50 transition-colors tracking-wider"
          title={t('about.tooltip.moveUp')}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onReorder(1)}
          className="flex-1 py-1.5 text-[10px] text-gray-500 hover:text-[#9A8266] hover:bg-gray-50 transition-colors tracking-wider border-l border-gray-100"
          title={t('about.tooltip.moveDown')}
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 py-1.5 text-[10px] text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors tracking-wider border-l border-gray-100"
          title={t('about.tooltip.delete')}
        >
          <Trash2 size={11} className="inline" />
        </button>
      </div>
    </div>
  );
}

function CertUploader({
  uploading,
  nextOrder,
  onUpload,
}: {
  uploading: boolean;
  nextOrder: number;
  onUpload: (f: File, order: number) => void;
}) {
  const { t } = useT();
  return (
    <label className="group relative aspect-square border border-dashed border-gray-300 hover:border-[#9A8266] hover:bg-[#9A8266]/[0.02] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f, nextOrder);
          e.target.value = '';
        }}
      />
      <Plus size={18} className="text-gray-300 group-hover:text-[#9A8266] transition-colors" strokeWidth={1.5} />
      <span className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">
        {uploading ? t('pe.uploading') : t('about.addCert')}
      </span>
    </label>
  );
}

function StatField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.25em] uppercase text-gray-500 mb-2 font-medium">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 focus:border-[#9A8266] focus:outline-none transition-colors text-base"
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        placeholder={placeholder}
      />
    </div>
  );
}
