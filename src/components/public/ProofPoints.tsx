import { getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';

/**
 * The three manufacturer proof points (warranty, in-house R&D, own factory),
 * shared by the homepage factory section and product pages. Homepage copy
 * lives in `home.whyPoint{1,2,3}`; product placements use the product-specific
 * `products.proofPoint{1,2,3}` keys. Deliberately plain, server-rendered text:
 * no heading tags and no structured data, so repeating it across product pages
 * stays SEO-neutral and never touches the Product JSON-LD.
 *
 * `stagger` (default true) renders the `data-reveal-stagger` wrapper so the
 * three points cascade in on scroll. The homepage passes `stagger={false}` so an
 * outer stagger can index these points as part of one continuous reveal.
 */
export default async function ProofPoints({
  className = '',
  stagger = true,
  align = 'start',
  noSnippet = false,
  copy = 'home',
}: {
  className?: string;
  stagger?: boolean;
  noSnippet?: boolean;
  copy?: 'home' | 'products';
  /** 'start' (default, used by PDPs): check + text on one line, left-aligned.
   *  'center' (homepage): check stacked above centered text, to sit under the
   *  centered stats band as one balanced, centered composition. */
  align?: 'start' | 'center';
}) {
  const t = await getTranslations(copy);
  const points =
    copy === 'products'
      ? [t('proofPoint1'), t('proofPoint2'), t('proofPoint3')]
      : [t('whyPoint1'), t('whyPoint2'), t('whyPoint3')];
  const centered = align === 'center';

  return (
    <div
      className={className}
      {...(stagger ? { 'data-reveal-stagger': '' } : {})}
      {...(noSnippet ? { 'data-nosnippet': '' } : {})}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-8">
        {points.map((p, i) => (
          <div
            key={i}
            data-reveal
            className={
              centered
                ? 'flex flex-col items-center text-center gap-3 md:px-6 md:border-e md:border-warm-border md:last:border-e-0'
                : 'flex items-start gap-4 md:pe-10 md:border-e md:border-warm-border md:last:border-e-0 md:last:pe-0'
            }
          >
            <Check size={20} strokeWidth={1.75} className={`text-bronze shrink-0 ${centered ? '' : 'mt-1'}`} aria-hidden />
            <p className="text-[16px] md:text-[17px] font-body font-normal text-ink leading-[1.55]">{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
