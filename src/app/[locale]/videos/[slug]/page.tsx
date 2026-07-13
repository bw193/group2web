import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/public/ProductCard';
import VideoCard from '@/components/public/videos/VideoCard';
import VideoPlayer from '@/components/public/videos/VideoPlayer';
import { JsonLd } from '@/components/seo/JsonLd';
import { locales, defaultLocale } from '@/i18n/config';
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  localeToOg,
  localizedUrl,
  pageCopy,
} from '@/lib/seo';
import { getUploadUrl } from '@/lib/utils';
import { getVideoDetailData, getVideoStaticParams } from '@/lib/videos';
import { buildVideoObjectSchema } from '@/lib/video-schema';
import { formatVideoDuration, videoExcerpt } from '@/lib/video-utils';

export const revalidate = 600;

export async function generateStaticParams() {
  return getVideoStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const detail = await getVideoDetailData(locale, slug);
  if (!detail) {
    return { title: `Videos - ${SITE_NAME}`, robots: { index: false, follow: true } };
  }

  const { video } = detail;
  const title = `${video.seoTitle || video.title} - ${SITE_NAME}`;
  const description = video.seoDescription || video.excerpt || videoExcerpt(video.body, 260) || pageCopy(locale, 'videos').description;
  const canonical = localizedUrl(locale, `/videos/${video.slug}`);
  const image = video.thumbnailUrl ? getUploadUrl(video.thumbnailUrl) : SITE_OG_IMAGE;
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = localizedUrl(loc, `/videos/${video.slug}`);
  }
  languages['x-default'] = localizedUrl(defaultLocale, `/videos/${video.slug}`);

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      locale: localeToOg(locale),
      images: [{ url: image, width: 1200, height: 630, alt: video.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('videos');
  const breadcrumbT = await getTranslations('breadcrumb');
  const detail = await getVideoDetailData(locale, slug);
  if (!detail) notFound();

  const { video, relatedProducts, relatedVideos } = detail;
  const videoUrl = localizedUrl(locale, `/videos/${video.slug}`);
  const description = video.excerpt || videoExcerpt(video.body, 500);
  const categoryLabel = video.category || t('videoFallback');
  const duration = formatVideoDuration(video.durationSeconds);
  const videoLd = buildVideoObjectSchema(
    { ...video, thumbnailUrl: video.thumbnailUrl ? getUploadUrl(video.thumbnailUrl) : video.thumbnailUrl },
    locale,
  );
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('videos'), item: localizedUrl(locale, '/videos') },
      { '@type': 'ListItem', position: 3, name: video.title, item: videoUrl },
    ],
  };

  return (
    <>
      <JsonLd id="ld-video" data={videoLd} />
      <JsonLd id="ld-video-breadcrumb" data={breadcrumbLd} />

      <nav aria-label="Breadcrumb" className="bg-cream border-b border-warm-border">
        <div className="container-wide py-4">
          <ol className="flex items-center gap-2.5 text-[12px] font-body font-semibold tracking-[0.12em] uppercase">
            <li className="flex-shrink-0">
              <Link href={`/${locale}`} className="text-ink-mid hover:text-ink transition-colors duration-300">
                {breadcrumbT('home')}
              </Link>
            </li>
            <li aria-hidden className="flex-shrink-0 text-ink-light">
              <ChevronRight size={13} strokeWidth={2} className="rtl:-scale-x-100" />
            </li>
            <li className="flex-shrink-0">
              <Link href={`/${locale}/videos`} className="text-ink-mid hover:text-ink transition-colors duration-300">
                {breadcrumbT('videos')}
              </Link>
            </li>
            <li aria-hidden className="flex-shrink-0 text-ink-light">
              <ChevronRight size={13} strokeWidth={2} className="rtl:-scale-x-100" />
            </li>
            <li className="min-w-0 truncate text-ink" aria-current="page">
              {video.title}
            </li>
          </ol>
        </div>
      </nav>

      <article className="bg-cream">
        <div className="container-wide py-12 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-20">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <VideoPlayer video={video} className="mx-auto lg:mx-0" />
            </div>

            <header className="order-1 lg:order-2 lg:sticky lg:top-28 lg:col-span-5">
              <div className="flex items-center gap-3 font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-bronze">
                <span>{categoryLabel}</span>
                {duration && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-warm-border" aria-hidden />
                    <span className="font-normal tracking-[0.08em] text-ink-mid">{duration}</span>
                  </>
                )}
              </div>

              <h1 className="mt-5 max-w-[14ch] font-display text-[clamp(2.7rem,4.25vw,4rem)] font-light leading-[0.98] tracking-[-0.025em] text-ink">
                {video.title}
              </h1>

              {description && (
                <p className="mt-7 max-w-[38ch] font-body text-[17px] font-normal leading-[1.7] text-ink-mid md:text-[18px]">
                  {description}
                </p>
              )}

              <Link
                href={`/${locale}/videos`}
                className="group mt-9 inline-flex items-center gap-3 border-t border-warm-border pt-5 font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-ink transition-colors hover:text-bronze"
              >
                <ArrowLeft size={14} strokeWidth={1.6} className="transition-transform duration-300 group-hover:-translate-x-1 rtl:-scale-x-100 rtl:group-hover:translate-x-1" />
                {t('backToVideos')}
              </Link>
            </header>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div id="related-products" className="container-wide pb-20 md:pb-24">
            <div className="border-t border-warm-border pt-12 md:pt-16">
              <div className="flex items-end justify-between mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1]">
                  {t('relatedProducts')}
                </h2>
                <Link
                  href={`/${locale}/products`}
                  className="hidden md:inline-flex items-center gap-2 text-[13px] font-body font-semibold tracking-[0.14em] uppercase text-ink hover:text-bronze transition-colors group"
                >
                  {t('viewAllProducts')}
                  <ArrowRight size={14} strokeWidth={1.75} className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14 md:gap-x-10 md:gap-y-16">
                {relatedProducts.map((product, i) => (
                  <ProductCard key={product.id} index={i} {...product} noSnippet />
                ))}
              </div>
            </div>
          </div>
        )}
      </article>

      {relatedVideos.length > 0 && (
        <section className="bg-sand/45 border-t border-warm-border">
          <div className="container-wide py-16 md:py-20">
            <div className="flex items-end justify-between mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1]">
                {t('relatedVideos')}
              </h2>
              <Link
                href={`/${locale}/videos`}
                className="hidden md:inline-flex items-center gap-2 text-[13px] font-body font-semibold tracking-[0.14em] uppercase text-ink hover:text-bronze transition-colors group"
              >
                {t('viewAllVideos')}
                <ArrowRight size={14} strokeWidth={1.75} className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-14 md:gap-x-10">
              {relatedVideos.map((item, i) => (
                <VideoCard
                  key={item.id}
                  video={item}
                  locale={locale}
                  index={i}
                  categoryFallback={t('videoFallback')}
                  watchLabel={t('watchVideo')}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
