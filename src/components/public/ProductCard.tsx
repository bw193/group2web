'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { getUploadUrl } from '@/lib/utils';

interface ProductCardProps {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string | null;
  modelNumber?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
  index?: number;
}

export default function ProductCard({
  name,
  slug,
  shortDescription,
  modelNumber,
  imageUrl,
  isFeatured,
  index,
}: ProductCardProps) {
  const t = useTranslations('products');
  const locale = useLocale();

  return (
    <article className="group">
      {/* Image */}
      <Link
        href={`/${locale}/products/${slug}`}
        className="block relative aspect-[4/5] overflow-hidden bg-sand mb-6"
      >
        {imageUrl ? (
          <>
            <Image
              src={getUploadUrl(imageUrl)}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-700" />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sand to-warm-gray text-center">
            <div className="w-14 h-20 border border-bronze/30 rounded-t-full bg-cream/40 mb-4" />
            <span className="text-[10px] font-body text-ink-light tracking-[0.28em] uppercase">Premium Mirror</span>
          </div>
        )}

        {/* Index number — editorial mark */}
        {typeof index === 'number' && (
          <span className="absolute top-4 left-4 font-body text-[10px] font-medium tracking-[0.28em] uppercase text-cream/90 mix-blend-difference">
            {String(index + 1).padStart(2, '0')}
          </span>
        )}

        {isFeatured && (
          <span className="absolute top-4 right-4 bg-cream text-ink text-[9px] font-body font-medium px-3 py-1 uppercase tracking-[0.24em]">
            {t('featured')}
          </span>
        )}
      </Link>

      {/* Content */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          {modelNumber ? (
            <p className="text-[10px] font-body text-ink-light tracking-[0.2em] uppercase">
              {modelNumber}
            </p>
          ) : (
            <span />
          )}
        </div>
        <h3 className="font-display text-[22px] font-light text-ink leading-[1.2] mb-3 tracking-[-0.005em] line-clamp-2">
          <Link
            href={`/${locale}/products/${slug}`}
            className="bg-left-bottom bg-gradient-to-r from-ink to-ink bg-[length:0%_1px] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]"
          >
            {name}
          </Link>
        </h3>
        {shortDescription && (
          <p className="text-[14px] font-body font-light text-ink-mid line-clamp-2 mb-5 leading-[1.7]">
            {shortDescription}
          </p>
        )}
        <div className="flex items-center gap-6 pt-4 border-t border-warm-border">
          <Link
            href={`/${locale}/products/${slug}`}
            className="nav-link text-[10px] font-body font-medium text-ink tracking-[0.24em] uppercase"
          >
            {t('viewDetails')}
          </Link>
          <Link
            href={`/${locale}/contact?product=${encodeURIComponent(name)}`}
            className="text-[10px] font-body font-medium text-ink-mid tracking-[0.24em] uppercase hover:text-bronze transition-colors duration-300"
          >
            {t('sendInquiry')}
          </Link>
        </div>
      </div>
    </article>
  );
}
