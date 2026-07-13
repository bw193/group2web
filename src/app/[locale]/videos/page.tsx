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

export const revalidate = 60;

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
        <div className="container-wide pb-7 pt-12 md:pb-4 md:pt-5">
          <p className="kicker" data-reveal>
            {t('kicker')}
          </p>
          <div className="mt-5 grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <h1
              className="max-w-[16ch] font-display text-[clamp(2.85rem,3.4vw,3rem)] font-light leading-[0.98] tracking-[-0.025em] text-ink lg:col-span-8"
              data-reveal
            >
              {t('heroTitle')}
            </h1>
            <div className="lg:col-span-4" data-reveal>
              <p className="max-w-[36ch] font-body text-[15px] font-normal leading-[1.6] text-ink-mid lg:ms-auto lg:text-start">
                {t('heroDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <VideosFilter videos={videos} locale={locale} />
    </>
  );
}
