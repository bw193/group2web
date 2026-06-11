import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';
import type { DisplayArticle } from './types';

/**
 * One story in the journal index — a full-width editorial row, not a product
 * card: hairline top rule, an index/meta column in small caps, a large serif
 * title with the site's underline-wipe, a two-line dek, and (only when the
 * article has an image) a compact thumbnail on the end side. Rows without
 * imagery stay purely typographic with a quiet wayfinding arrow.
 */
export default function StoryRow({
  article,
  eager = false,
}: {
  article: DisplayArticle;
  eager?: boolean;
}) {
  return (
    <Link
      href={article.href}
      className="group grid grid-cols-1 md:grid-cols-12 gap-x-6 lg:gap-x-8 gap-y-4 items-start py-9 md:py-11 border-b border-warm-border"
    >
      {/* Meta — stacked column on desktop, single inline row on mobile */}
      <div className="md:col-span-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 md:block">
        <span className="font-display text-[15px] leading-none text-ink-light md:block">
          {article.indexLabel}
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
      <div className={article.imagePath ? 'md:col-span-7' : 'md:col-span-9'}>
        <h2 className="font-display text-[26px] md:text-[31px] lg:text-[34px] font-normal leading-[1.12] tracking-[-0.015em] text-ink max-w-[26ch]">
          <span className="bg-left-bottom rtl:bg-right-bottom bg-gradient-to-r from-ink to-ink bg-[length:0%_1px] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
            {article.title}
          </span>
        </h2>
        {article.dek && (
          <p className="mt-3.5 text-[15.5px] font-body leading-[1.65] text-ink-mid max-w-[58ch] line-clamp-2">
            {article.dek}
          </p>
        )}
      </div>

      {/* End side: thumbnail only when the story has one; otherwise a quiet arrow */}
      {article.imagePath ? (
        <div className="md:col-span-3 order-first md:order-none">
          <div className="relative aspect-[3/2] md:aspect-[4/3] overflow-hidden bg-sand">
            <GalleryImage
              path={article.imagePath}
              alt={article.title}
              fill
              priority={eager}
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
            />
          </div>
        </div>
      ) : (
        <div className="hidden md:flex md:col-span-1 md:col-start-12 justify-end pt-3.5">
          <ArrowRight
            size={18}
            strokeWidth={1.5}
            className="text-ink-light transition-all duration-500 group-hover:text-bronze group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
          />
        </div>
      )}
    </Link>
  );
}
