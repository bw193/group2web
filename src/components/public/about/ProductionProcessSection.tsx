import { getTranslations } from 'next-intl/server';
import ProductionProcessViewer from './ProductionProcessViewer';

/**
 * The four stages a panel passes through on the Jiaxing floor, as a short
 * walkthrough: one line per stage, one photo at a time.
 *
 * These stills are repo assets rather than CMS gallery rows on purpose: each
 * one illustrates the specific stage named beside it, so a photo swapped in
 * the CMS would leave the copy pointing at the wrong machine. The open album —
 * which the CMS does own — stays in `FactoryGalleryShowcase`.
 */
export default async function ProductionProcessSection() {
  const t = await getTranslations('about');

  const steps = [
    {
      src: '/images/production/precision-cutting.webp', // cutting table
      title: t('processStep1Title'),
      line: t('processStep1Body'),
      alt: t('processStep1Alt'),
    },
    {
      src: '/images/production/edging-polishing.webp', // multi-head edger
      title: t('processStep2Title'),
      line: t('processStep2Body'),
      alt: t('processStep2Alt'),
    },
    {
      src: '/images/production/drawing-check.webp', // control station
      title: t('processStep3Title'),
      line: t('processStep3Body'),
      alt: t('processStep3Alt'),
    },
    {
      src: '/images/production/final-inspection.webp', // lit-mirror bench
      title: t('processStep4Title'),
      line: t('processStep4Body'),
      alt: t('processStep4Alt'),
    },
  ];

  return (
    <section aria-labelledby="production-process-heading" className="bg-cream border-b border-warm-border">
      <div className="container-wide py-20 md:py-24">
        <div className="mb-10 md:mb-12" data-reveal>
          <p className="mb-4 font-body text-[13px] font-semibold uppercase tracking-[0.18em] text-bronze">
            {t('processKicker')}
          </p>
          <h2
            id="production-process-heading"
            className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-ink md:text-4xl"
          >
            {t('processHeading')}
          </h2>
        </div>

        <ProductionProcessViewer steps={steps} />
      </div>
    </section>
  );
}
