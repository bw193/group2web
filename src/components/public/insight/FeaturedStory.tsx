import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';
import type { DisplayArticle } from './types';

/**
 * The lead story of whatever list is on screen — the first article promoted out
 * of the row list and given a spread: an oversized serif headline on the start
 * side, the dek and byline on the end side. Stories with a cover run the image
 * across the end column instead and stack the type beside it, so the two shapes
 * fill the same width and the slot never reads as a missing picture.
 */
export default function FeaturedStory({
  article,
  label,
  readLabel,
}: {
  article: DisplayArticle;
  label: string;
  readLabel: string;
}) {
  const hasImage = Boolean(article.imagePath);

  const meta = (
    <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 text-[12px] font-body uppercase">
      <span className="font-semibold tracking-[0.16em] text-bronze">{article.categoryLabel}</span>
      <span aria-hidden className="text-ink-light">
        —
      </span>
      <span className="tracking-[0.1em] text-ink-mid">{article.dateLabel}</span>
      <span aria-hidden className="text-ink-light">
        —
      </span>
      <span className="tracking-[0.1em] text-ink-mid whitespace-nowrap">{article.readLabel}</span>
    </div>
  );

  const cta = (
    <span className="btn-ghost mt-8 group-hover:text-bronze">
      {readLabel}
      <ArrowRight
        size={14}
        strokeWidth={1.75}
        className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
      />
    </span>
  );

  const headline = (
    <span className="bg-left-bottom rtl:bg-right-bottom bg-gradient-to-r from-ink to-ink bg-[length:0%_1px] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
      {article.title}
    </span>
  );

  return (
    <Link
      href={article.href}
      className="group block border-b border-warm-border py-10 md:py-14"
    >
      <p className="kicker-plain">{label}</p>

      {hasImage ? (
        <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-x-8 lg:gap-x-14 gap-y-8 items-center">
          <div className="lg:col-span-7 lg:order-last">
            <div className="relative aspect-[4/3] lg:aspect-[16/10] overflow-hidden bg-sand">
              <GalleryImage
                path={article.imagePath as string}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.03]"
              />
              <span
                aria-hidden
                className="absolute inset-3 md:inset-4 border border-white/30 pointer-events-none z-[1]"
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <h2 className="font-display font-light text-ink text-[clamp(1.95rem,3.1vw,2.9rem)] leading-[1.06] tracking-[-0.02em] text-balance">
              {headline}
            </h2>
            {article.dek && (
              <p className="mt-5 font-body text-[16.5px] md:text-[17.5px] leading-[1.7] text-ink-mid max-w-[48ch]">
                {article.dek}
              </p>
            )}
            <div className="mt-7">{meta}</div>
            {cta}
          </div>
        </div>
      ) : (
        <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-x-8 lg:gap-x-16 gap-y-8">
          <h2 className="lg:col-span-7 font-display font-light text-ink text-[clamp(2.1rem,4.2vw,3.5rem)] leading-[1.03] tracking-[-0.025em] max-w-[19ch] text-balance">
            {headline}
          </h2>
          <div className="lg:col-span-5 lg:border-s lg:border-warm-border lg:ps-12 lg:self-end">
            {article.dek && (
              <p className="font-body text-[16.5px] md:text-[18px] leading-[1.7] text-ink-mid max-w-[46ch]">
                {article.dek}
              </p>
            )}
            <div className="mt-7">{meta}</div>
            {cta}
          </div>
        </div>
      )}
    </Link>
  );
}
