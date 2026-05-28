import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Check, ArrowRight } from 'lucide-react';

/**
 * Homepage "Why Choose Us" teaser — sits right after the factory section as the
 * close of the manufacturing story, then links to the full comparison page.
 * Deliberately lightweight: server-rendered, static `home`-namespace copy, no DB
 * query, no client JS beyond the shared `data-reveal` animation. Header row
 * (heading + CTA) over a full-width 3-column proof row so the band reads as a
 * balanced unit with no empty corners.
 */
export default async function WhyChooseUsTeaser({ locale }: { locale: string }) {
  const t = await getTranslations('home');
  const points = [t('whyPoint1'), t('whyPoint2'), t('whyPoint3')];

  return (
    <section className="bg-cream border-b border-warm-border">
      <div className="container-wide py-20 md:py-28">
        {/* Header row — heading left, CTA right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-end mb-12 md:mb-16">
          <div className="lg:col-span-8" data-reveal>
            <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5">
              {t('whyEyebrow')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-ink leading-[1.05] tracking-[-0.02em] max-w-2xl">
              {t('whyHeading')}
            </h2>
          </div>
          <div className="lg:col-span-4 lg:text-right lg:pb-1.5" data-reveal>
            <Link href={`/${locale}/why-choose-us`} className="btn-primary group">
              {t('whyCta')}
              <ArrowRight size={14} strokeWidth={1.75} className="ml-3 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Proof points — full-width three-column row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8 border-t border-warm-border pt-10 md:pt-12" data-reveal-stagger>
          {points.map((p, i) => (
            <div key={i} data-reveal className="flex items-start gap-4">
              <Check size={20} strokeWidth={1.75} className="text-bronze mt-0.5 shrink-0" aria-hidden />
              <p className="text-[16px] md:text-[17px] font-body font-normal text-ink leading-[1.55]">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
