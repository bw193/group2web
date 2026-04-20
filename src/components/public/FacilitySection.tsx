import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import FacilityGallery from './FacilityGallery';
import { Cog, ShieldCheck, Ship, Microscope, ArrowRight } from 'lucide-react';

interface Props {
  locale: string;
  images?: (string | null)[];
}

export default async function FacilitySection({ locale, images = [] }: Props) {
  const t = await getTranslations('home');
  const gallerySrcs = images.filter((v): v is string => !!v);

  const capabilities = [
    {
      Icon: Cog,
      label: 'Vertical Integration',
      text: 'In-house design, glass processing, LED assembly, and finishing — full control from sketch to shipment.',
    },
    {
      Icon: ShieldCheck,
      label: 'Certified Quality',
      text: 'ISO 9001:2015 operations with CE, CB, SAA, ETL, RoHS and IP44/54 compliance on every SKU.',
    },
    {
      Icon: Microscope,
      label: 'R&D Studio',
      text: 'Dedicated engineering team iterating on optics, anti-fog technology and smart touch controls.',
    },
    {
      Icon: Ship,
      label: 'Global Logistics',
      text: 'Export-grade packaging and consolidated container shipping to 60+ countries.',
    },
  ];

  const stats = [
    { value: '35K', unit: 'SQM', label: 'Facility Footprint' },
    { value: '200+', unit: 'STAFF', label: 'Skilled Workforce' },
    { value: '500K', unit: 'UNITS/YR', label: 'Annual Capacity' },
    { value: '21+', unit: 'YEARS', label: 'Since 2005' },
  ];

  return (
    <section className="relative section-padding bg-cream overflow-hidden">
      {/* Atmospheric texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #9A8266 0.5px, transparent 0.5px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Vertical rule in deep background */}
      <div
        aria-hidden
        className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-warm-border/60 pointer-events-none"
      />

      <div className="container-wide relative">
        {/* Eyebrow row */}
        <div className="flex items-center gap-4 mb-10" data-reveal>
          <span className="text-[11px] font-body font-medium text-bronze tracking-[0.3em] uppercase">
            02 / The Facility
          </span>
          <span className="flex-1 h-px bg-warm-border" />
          <span className="text-[10px] font-body font-light text-ink-light tracking-[0.25em] uppercase">
            Jiaxing · Zhejiang · China
          </span>
        </div>

        {/* Main asymmetric grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Image gallery — spans 7 cols */}
          <div className="lg:col-span-7" data-reveal>
            <FacilityGallery images={gallerySrcs} />
          </div>

          {/* Content column — spans 5 cols */}
          <div className="lg:col-span-5 lg:pl-4 xl:pl-8" data-reveal>
            <h2 className="text-4xl md:text-5xl font-display font-medium leading-[1.05] mb-6">
              {t('factoryTitle')}
            </h2>
            <div className="w-12 h-px bg-bronze mb-8" />

            <p className="text-ink-mid font-body font-light leading-relaxed text-base md:text-lg mb-8">
              {t('factoryDesc')}. Four production lines, a dedicated R&D studio,
              and an export-focused quality system — we ship globally with the
              craftsmanship of a studio and the throughput of a factory.
            </p>

            {/* Capability callouts */}
            <ul className="divide-y divide-warm-border border-y border-warm-border">
              {capabilities.map(({ Icon, label, text }, i) => (
                <li key={label} className="group py-5 flex gap-5">
                  <span className="shrink-0 text-[10px] font-body font-light text-ink-light tracking-[0.2em] pt-1 w-7">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="shrink-0 w-9 h-9 border border-warm-border flex items-center justify-center transition-colors duration-500 group-hover:border-bronze group-hover:bg-bronze-subtle/40">
                    <Icon size={15} strokeWidth={1.4} className="text-bronze" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg text-ink leading-tight mb-1">
                      {label}
                    </p>
                    <p className="text-[13px] font-body font-light text-ink-mid leading-relaxed">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-10 flex items-center gap-6">
              <Link
                href={`/${locale}/about`}
                className="btn-primary text-xs uppercase tracking-[0.12em] group inline-flex items-center"
              >
                Inside the Factory
                <ArrowRight
                  size={14}
                  className="ml-3 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="text-[11px] font-body font-medium text-ink-mid hover:text-ink tracking-[0.15em] uppercase nav-link"
              >
                Request a Tour
              </Link>
            </div>
          </div>
        </div>

        {/* Stats band — horizontal rule across full width */}
        <div className="mt-20 md:mt-28 pt-10 border-t border-warm-border">
          <div className="grid grid-cols-2 md:grid-cols-4" data-reveal-stagger>
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`relative px-4 md:px-8 py-6 md:py-4 ${
                  i < stats.length - 1 ? 'md:border-r border-warm-border' : ''
                } ${i % 2 === 0 ? 'border-r md:border-r' : ''} ${
                  i < 2 ? 'border-b md:border-b-0 border-warm-border' : ''
                }`}
                data-reveal
              >
                <p className="font-display text-5xl md:text-6xl font-light text-bronze leading-none mb-3">
                  {s.value}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] font-body font-medium text-ink tracking-[0.25em] uppercase">
                    {s.unit}
                  </span>
                  <span className="h-px flex-1 bg-warm-border" />
                </div>
                <p className="mt-2 text-[11px] font-body font-light text-ink-mid tracking-wide">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
