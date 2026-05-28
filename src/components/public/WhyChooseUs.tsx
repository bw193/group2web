import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Check, Minus, ArrowRight } from 'lucide-react';

interface Criterion {
  label: string;
  us: string;
  them: string;
  heading: string;
  body: string;
}

/**
 * "Why Choose Us" comparison — Chengtai vs. a generic "typical supplier".
 * Content-only (no DB); all copy comes from the `whyUs` i18n namespace so the
 * page prerenders as static. Our column is emphasised (sand panel, bronze
 * check); the competitor column stays neutral (muted text, minus icon) so we
 * win on substance rather than by disparaging anyone. Icons are decorative —
 * every cell carries the full statement as text (no meaning conveyed by colour
 * or icon alone).
 */
export default async function WhyChooseUs({ locale }: { locale: string }) {
  const t = await getTranslations('whyUs');
  const criteria = (t.raw('criteria') as Criterion[]) ?? [];
  const heroStats = (t.raw('heroStats') as { value: string; label: string }[]) ?? [];

  return (
    <>
      {/* Hero / intro */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide pt-16 pb-14 md:pt-24 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5" data-reveal>
                {t('eyebrow')}
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-[64px] font-normal text-ink leading-[1.05] tracking-[-0.02em]" data-reveal>
                {t('title')}
              </h1>
              <p className="mt-6 text-[17px] md:text-[19px] font-body font-normal text-ink leading-[1.6] max-w-xl" data-reveal>
                {t('intro')}
              </p>
            </div>
            {heroStats.length > 0 && (
              <div className="lg:col-span-5" data-reveal>
                <div className="grid grid-cols-2 border-t border-l border-warm-border">
                  {heroStats.map((s, i) => (
                    <div key={i} className="border-b border-r border-warm-border p-5 md:p-6">
                      <p className="font-display text-3xl md:text-4xl font-normal text-ink leading-none tracking-[-0.01em]">
                        {s.value}
                      </p>
                      <p className="mt-2 text-[12px] font-body font-semibold uppercase tracking-[0.12em] text-ink-mid leading-snug">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* At-a-glance comparison */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide py-16 md:py-24">
          <div className="mb-10 md:mb-14" data-reveal>
            <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-4">
              {t('tableEyebrow')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-ink leading-[1.05] tracking-[-0.02em]">
              {t('tableHeading')}
            </h2>
          </div>

          {/* Column headers — desktop only */}
          <div className="hidden md:grid md:grid-cols-[1.1fr_1.4fr_1.4fr] border-b border-warm-border">
            <div aria-hidden />
            <div className="px-6 py-4 bg-sand/60 border-x border-warm-border">
              <p className="font-display text-[22px] font-normal text-ink leading-none">{t('ourLabel')}</p>
            </div>
            <div className="px-6 py-4 flex items-end">
              <p className="font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-mid">{t('theirLabel')}</p>
            </div>
          </div>

          {/* Rows */}
          <div data-reveal-stagger>
            {criteria.map((c, i) => (
              <div
                key={i}
                data-reveal
                className="grid grid-cols-1 md:grid-cols-[1.1fr_1.4fr_1.4fr] border-b border-warm-border"
              >
                {/* Criterion */}
                <div className="pt-6 md:py-7 md:pr-6">
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-bronze md:text-ink-mid">
                    {c.label}
                  </p>
                </div>

                {/* Chengtai */}
                <div className="py-4 md:py-7 md:px-6 bg-sand/60 md:border-x border-warm-border">
                  <p className="md:hidden font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-ink mb-2">
                    {t('ourLabel')}
                  </p>
                  <div className="flex items-start gap-3">
                    <Check size={18} strokeWidth={2} className="text-bronze mt-0.5 shrink-0" aria-hidden />
                    <p className="text-[15px] md:text-[16px] font-body font-normal text-ink leading-[1.55]">{c.us}</p>
                  </div>
                </div>

                {/* Typical supplier */}
                <div className="py-4 pb-6 md:py-7 md:px-6">
                  <p className="md:hidden font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-mid mb-2">
                    {t('theirLabel')}
                  </p>
                  <div className="flex items-start gap-3">
                    <Minus size={18} strokeWidth={2} className="text-ink-light mt-0.5 shrink-0" aria-hidden />
                    <p className="text-[15px] md:text-[16px] font-body font-normal text-ink-mid leading-[1.55]">{c.them}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expanded criteria — one section each */}
      {criteria.map((c, i) => (
        <section key={i} className={`${i % 2 === 0 ? 'bg-sand' : 'bg-cream'} border-b border-warm-border`}>
          <div className="container-wide py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              <div className="lg:col-span-5" data-reveal>
                <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5">
                  {String(i + 1).padStart(2, '0')} — {c.label}
                </p>
                <h2 className="font-display text-3xl md:text-4xl lg:text-[44px] font-normal text-ink leading-[1.08] tracking-[-0.02em]">
                  {c.heading}
                </h2>
              </div>
              <div className="lg:col-span-7 lg:pt-2" data-reveal>
                <p className="text-[17px] md:text-[18px] font-body font-normal text-ink leading-[1.65] max-w-xl">
                  {c.body}
                </p>
                <div className="mt-6 flex items-start gap-3 max-w-xl border-t border-warm-border pt-5">
                  <Minus size={16} strokeWidth={2} className="text-ink-light mt-1 shrink-0" aria-hidden />
                  <p className="text-[14px] md:text-[15px] font-body text-ink-mid leading-[1.55]">
                    <span className="font-semibold">{t('theirLabel')}:</span> {c.them}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-ink text-cream">
        <div className="container-wide py-20 md:py-28 text-center">
          <p className="text-[13px] font-body font-semibold text-bronze-light uppercase tracking-[0.18em] mb-5" data-reveal>
            {t('ctaEyebrow')}
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.05] tracking-[-0.01em] max-w-3xl mx-auto" data-reveal>
            {t('ctaHeading')}
          </h2>
          <p className="mt-6 text-[17px] md:text-[18px] font-body font-normal text-cream/80 leading-[1.6] max-w-xl mx-auto" data-reveal>
            {t('ctaBody')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center" data-reveal>
            <Link
              href={`/${locale}/contact`}
              className="group inline-flex items-center gap-3 bg-cream text-ink px-8 h-12 text-[12px] font-body font-semibold tracking-[0.16em] uppercase hover:bg-bronze-light transition-colors duration-500"
            >
              {t('ctaPrimary')}
              <ArrowRight size={15} strokeWidth={1.75} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center h-12 px-4 text-[12px] font-body font-semibold tracking-[0.16em] uppercase text-cream/70 hover:text-cream transition-colors duration-300"
            >
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
