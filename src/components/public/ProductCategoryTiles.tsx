import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';
import type { ProductCategoryTile } from '@/lib/product-categories';

/**
 * One photo tile per category at the top of /products, so the product lines
 * read at a glance before the mixed grid; the button row below repeats them
 * for switching while scrolling. Plain links with no heading tags, so the
 * page outline is unchanged, and data-nosnippet keeps the names and counts
 * out of search snippets. The photos are decorative (empty alt): each link
 * is named by its category.
 */
export default async function ProductCategoryTiles({ tiles }: { tiles: ProductCategoryTile[] }) {
  if (tiles.length < 2) return null;
  const t = await getTranslations('products');

  return (
    <section className="bg-cream border-b border-warm-border" data-nosnippet="">
      <div className="container-wide pt-9 pb-11 md:pt-12 md:pb-14">
        {/* CSS-only entrance like the grid's, so the photos (often the LCP
            element here) don't wait for the scroll-reveal script. */}
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-10 animate-fade-up">
          {tiles.map((tile) => (
            <li key={tile.key}>
              {/* Full height with the count pushed down, so the counts in a
                  row line up when a long name takes two lines. */}
              <Link href={tile.href} className="group flex flex-col h-full">
                {/* Square like the product cards below, so the photos show whole. */}
                <span className="block relative aspect-square overflow-hidden bg-sand">
                  {tile.imageUrl && (
                    <GalleryImage
                      path={tile.imageUrl}
                      alt=""
                      fill
                      priority
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]"
                    />
                  )}
                  <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-700" />
                </span>
                <span className="block mt-4 md:mt-5 font-display text-[21px] md:text-[26px] font-normal text-ink leading-[1.15] tracking-[-0.005em]">
                  <span className="bg-left-bottom rtl:bg-right-bottom bg-gradient-to-r from-ink to-ink bg-[length:0%_1px] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                    {tile.label}
                  </span>
                </span>
                <span className="mt-auto pt-2 flex items-center gap-2 text-[11px] md:text-[12px] font-body font-semibold text-bronze tracking-[0.14em] uppercase">
                  {t('categoryCount', { count: tile.count })}
                  <ArrowRight
                    size={13}
                    strokeWidth={1.75}
                    aria-hidden
                    className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
