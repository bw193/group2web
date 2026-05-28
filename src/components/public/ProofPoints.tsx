import { getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';

/**
 * The three manufacturer proof points (warranty · in-house R&D · own factory),
 * shared by the homepage factory section and every product detail page. Copy
 * lives in the `home.whyPoint{1,2,3}` i18n keys, so a single edit updates both
 * places. Deliberately plain, server-rendered text — no heading tags and no
 * structured data — so repeating it across ~378 product pages stays SEO-neutral
 * (it reads as template chrome, like a footer, and never touches the Product
 * JSON-LD). `className` controls the outer spacing/divider per placement.
 */
export default async function ProofPoints({ className = '' }: { className?: string }) {
  const t = await getTranslations('home');
  const points = [t('whyPoint1'), t('whyPoint2'), t('whyPoint3')];

  return (
    <div className={className} data-reveal-stagger>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
        {points.map((p, i) => (
          <div
            key={i}
            data-reveal
            className="flex items-start gap-4 md:pr-10 md:border-r md:border-warm-border md:last:border-r-0 md:last:pr-0"
          >
            <Check size={20} strokeWidth={1.75} className="text-bronze mt-1 shrink-0" aria-hidden />
            <p className="text-[16px] md:text-[17px] font-body font-normal text-ink leading-[1.55]">{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
