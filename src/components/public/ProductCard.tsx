'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';

interface ProductCardProps {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string | null;
  modelNumber?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
}

export default function ProductCard({
  id,
  name,
  slug,
  shortDescription,
  modelNumber,
  imageUrl,
  isFeatured,
}: ProductCardProps) {
  const t = useTranslations('products');
  const locale = useLocale();

  return (
    <div className="group card-hover">
      {/* Image */}
      <Link
        href={`/${locale}/products/${slug}`}
        className="block relative aspect-[4/5] overflow-hidden bg-sand mb-5 rounded-sm"
      >
        <Image
          src={getUploadUrl(imageUrl)}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-110"
          loading="lazy"
        />
        {/* Soft cream wash on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {isFeatured && (
          <span className="absolute top-4 left-4 bg-cream/95 backdrop-blur-sm text-ink text-[10px] font-body font-medium px-3 py-1.5 uppercase tracking-[0.18em] rounded-full">
            {t('featured')}
          </span>
        )}

        {/* Floating arrow disc */}
        <div className="absolute bottom-4 right-4 w-11 h-11 flex items-center justify-center bg-cream text-ink opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 ease-out-expo rounded-full shadow-[0_10px_30px_-10px_rgba(42,38,32,0.4)]">
          <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:rotate-45" />
        </div>
      </Link>

      {/* Content */}
      <div>
        {modelNumber && (
          <p className="text-[11px] font-body text-ink-light tracking-[0.1em] uppercase mb-1.5">
            {modelNumber}
          </p>
        )}
        <h3 className="font-display text-xl font-medium text-ink mb-2 line-clamp-2 group-hover:text-bronze transition-colors duration-300">
          {name}
        </h3>
        {shortDescription && (
          <p className="text-sm font-body font-light text-ink-mid line-clamp-2 mb-4">
            {shortDescription}
          </p>
        )}
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/products/${slug}`}
            className="text-xs font-body font-medium text-ink tracking-[0.08em] uppercase nav-link"
          >
            {t('viewDetails')}
          </Link>
          <span className="text-warm-border">|</span>
          <Link
            href={`/${locale}/contact?product=${encodeURIComponent(name)}`}
            className="text-xs font-body font-medium text-bronze tracking-[0.08em] uppercase hover:text-espresso transition-colors duration-300"
          >
            {t('sendInquiry')}
          </Link>
        </div>
      </div>
    </div>
  );
}
