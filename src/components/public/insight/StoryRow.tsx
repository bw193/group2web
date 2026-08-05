import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';
import type { DisplayArticle } from './types';

/**
 * One story in the journal index — a full-width editorial row, not a product
 * card: an index/meta rail in small caps, a large serif title with the site's
 * underline-wipe, a two-line dek, and (only when the article has an image) a
 * compact thumbnail on the end side. Rows without imagery stay purely
 * typographic and close on a hairline arrow plate, so every row terminates at
 * the same edge instead of trailing off into the gutter.
 */
export default function StoryRow({
  article,
  indexLabel,
  eager = false,
}: {
  article: DisplayArticle;
  /** Position within the list currently on screen, zero-padded ("02"). */
  indexLabel: string;
  eager?: boolean;
}) {
  const hasImage = Boolean(article.imagePath);

  return (
    <Link
      href={article.href}
      className="group relative grid grid-cols-1 md:grid-cols-12 gap-x-6 lg:gap-x-8 gap-y-4 items-center py-8 md:py-10 border-b border-warm-border transition-colors duration-500 hover:border-ink/25"
    >
      {/* Hover wash — bleeds past the container gutter so the whole row reads
          as one target. Sits first in the DOM, so the positioned content below
          paints over it. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -inset-x-4 md:-inset-x-6 bg-sand opacity-0 transition-opacity duration-500 group-hover:opacity-70"
      />

      {/* Meta rail — stacked column on desktop, single inline row on mobile */}
      <div className="relative md:col-span-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 md:block">
        <span className="font-display text-[15px] leading-none text-ink-light transition-colors duration-500 group-hover:text-bronze md:block">
          {indexLabel}
        </span>
        <span className="text-[12px] font-body font-semibold tracking-[0.16em] uppercase text-bronze md:block md:mt-3.5">
          {article.categoryLabel}
        </span>
        <span className="text-[12px] font-body tracking-[0.1em] uppercase text-ink-mid md:block md:mt-2">
          {article.dateLabel}
        </span>
        <span className="text-[12px] font-body tracking-[0.1em] uppercase text-ink-light whitespace-nowrap md:block md:mt-1.5">
          {article.readLabel}
        </span>
      </div>

      {/* Title + dek */}
      <div className={`relative ${hasImage ? 'md:col-span-6' : 'md:col-span-8'}`}>
        <h2 className="font-display text-[25px] md:text-[29px] lg:text-[32px] font-normal leading-[1.14] tracking-[-0.015em] text-ink max-w-[40ch] text-balance">
          <span className="bg-left-bottom rtl:bg-right-bottom bg-gradient-to-r from-ink to-ink bg-[length:0%_1px] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
            {article.title}
          </span>
        </h2>
        {article.dek && (
          <p className="mt-3 text-[15.5px] font-body leading-[1.65] text-ink-mid max-w-[62ch] line-clamp-2">
            {article.dek}
          </p>
        )}
        {article.author && (
          <p className="mt-3.5 text-[11.5px] font-body font-semibold tracking-[0.16em] uppercase text-ink-light">
            {article.author}
          </p>
        )}
      </div>

      {/* End side: thumbnail when the story has one, then the arrow plate */}
      {hasImage && (
        <div className="relative md:col-span-3 order-first md:order-none">
          <div className="relative aspect-[3/2] md:aspect-[16/10] overflow-hidden bg-sand">
            <GalleryImage
              path={article.imagePath as string}
              alt={article.title}
              fill
              priority={eager}
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
            />
          </div>
        </div>
      )}

      <div className="relative hidden md:flex md:col-span-1 md:col-start-12 justify-end">
        <span className="flex h-11 w-11 items-center justify-center border border-warm-border text-ink-light transition-colors duration-500 group-hover:border-bronze group-hover:bg-bronze group-hover:text-cream">
          <ArrowRight
            size={17}
            strokeWidth={1.5}
            className="transition-transform duration-500 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
