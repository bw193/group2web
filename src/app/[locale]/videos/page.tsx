import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import VideosFilter from './VideosFilter';
import { getVideosIndexData } from '@/lib/videos';
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
  buildAlternates,
  localeToOg,
  localizedUrl,
  pageCopy,
} from '@/lib/seo';
import { buildVideoObjectSchema } from '@/lib/video-schema';

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = pageCopy(locale, 'videos');
  const url = localizedUrl(locale, '/videos');

  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(locale, '/videos'),
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      title: copy.title,
      description: copy.description,
      locale: localeToOg(locale),
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('videos');
  const breadcrumbT = await getTranslations('breadcrumb');
  const copy = pageCopy(locale, 'videos');
  const { videos } = await getVideosIndexData(locale);
  const videosUrl = localizedUrl(locale, '/videos');

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${videosUrl}#videos`,
    name: t('heroTitle'),
    description: copy.description,
    url: videosUrl,
    inLanguage: locale,
    publisher: { '@id': `${SITE_URL}/#organization` },
    hasPart: videos.slice(0, 12).map((video) => buildVideoObjectSchema(video, locale)),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('videos'), item: videosUrl },
    ],
  };

  return (
    <>
      <JsonLd id="ld-videos-collection" data={collectionLd} />
      <JsonLd id="ld-videos-breadcrumb" data={breadcrumbLd} />

      <section className="bg-cream">
        <div className="container-wide pt-14 md:pt-[88px] pb-12 md:pb-16">
          <p className="kicker" data-reveal>{t('kicker')}</p>
          <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <h1
              className="lg:col-span-8 font-display font-light text-ink text-[clamp(2.9rem,6.6vw,5.4rem)] leading-[0.98] tracking-[-0.025em] max-w-[15ch]"
              data-reveal
            >
              {t('heroTitle')}
            </h1>
            <div className="lg:col-span-4 lg:text-end" data-reveal>
              <p className="font-body text-[16px] md:text-[17px] leading-[1.65] text-ink-mid max-w-[36ch] lg:ms-auto">
                {copy.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <VideosFilter videos={videos} locale={locale} />
    </>
  );
}
