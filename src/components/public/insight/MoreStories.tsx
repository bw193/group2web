import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface MoreStoryItem {
  href: string;
  categoryLabel: string;
  dateLabel: string;
  title: string;
}

/**
 * "Continue reading" band at the end of an article: a sand-toned close with
 * three text-only story rows — hairline tops, category small caps, serif
 * titles — quiet on purpose after the product grid.
 */
export default function MoreStories({
  heading,
  allStoriesLabel,
  allStoriesHref,
  items,
}: {
  heading: string;
  allStoriesLabel: string;
  allStoriesHref: string;
  items: MoreStoryItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="bg-sand">
      <div className="container-wide py-16 md:py-20">
        <div className="flex items-end justify-between gap-6 mb-10 md:mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1]">
            {heading}
          </h2>
          <Link
            href={allStoriesHref}
            className="hidden md:inline-flex items-center gap-2 text-[13px] font-body font-semibold tracking-[0.14em] uppercase text-ink hover:text-bronze transition-colors group"
          >
            {allStoriesLabel}
            <ArrowRight
              size={14}
              strokeWidth={1.75}
              className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-8">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="group border-t border-ink/15 pt-6">
              <div className="flex items-baseline gap-x-3 text-[12px] font-body uppercase">
                <span className="font-semibold tracking-[0.16em] text-bronze">{item.categoryLabel}</span>
                <span aria-hidden className="text-ink-light">·</span>
                <span className="tracking-[0.1em] text-ink-mid">{item.dateLabel}</span>
              </div>
              <h3 className="mt-3 font-display text-[22px] font-normal leading-[1.2] tracking-[-0.01em] text-ink">
                <span className="bg-left-bottom rtl:bg-right-bottom bg-gradient-to-r from-ink to-ink bg-[length:0%_1px] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                  {item.title}
                </span>
              </h3>
            </Link>
          ))}
        </div>

        <Link
          href={allStoriesHref}
          className="md:hidden mt-10 btn-ghost"
        >
          {allStoriesLabel}
          <ArrowRight size={14} strokeWidth={1.75} className="rtl:-scale-x-100" />
        </Link>
      </div>
    </section>
  );
}
