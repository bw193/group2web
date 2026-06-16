import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  getInsightIndexData,
  formatArticleDate,
  categoryFallbackLabel,
} from '@/lib/insight';
import InsightIndex from '@/components/public/insight/InsightIndex';
import type { DisplayArticle } from '@/components/public/insight/types';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
  buildAlternates,
  localeToOg,
  localizedUrl,
  pageCopy,
} from '@/lib/seo';
import { getUploadUrl } from '@/lib/utils';

export const revalidate = 600;

// Insight pages are NOT prerendered at build. Rendering them during the build's
// concurrent burst exhausts/poisons the small DB pool (every build that
// prerendered insight failed — even a single locale — while main + 300 more
// product pages builds fine; the queries themselves run in ~200ms). They render
// on-demand at runtime from the dub1 region (next to the eu-west-1 DB, fast) and
// cache for `revalidate`. SEO unchanged — crawlers get fully rendered HTML.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = pageCopy(locale, 'insight');
  const url = localizedUrl(locale, '/insight');

  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(locale, '/insight'),
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

export default async function InsightPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('insight');
  const breadcrumbT = await getTranslations('breadcrumb');
  // The masthead dek renders the SERP meta description verbatim (same source
  // as generateMetadata), so on-page copy and the snippet can never drift.
  const copy = pageCopy(locale, 'insight');

  // One cached call, one cold-connection setup. Both pieces are needed
  // to render and share an invalidation cadence anyway.
  const { list, categories } = await getInsightIndexData(locale);
  const catMap = new Map(categories.map((c) => [c.key, c.name]));
  const catLabel = (key: string) => catMap.get(key) ?? categoryFallbackLabel(key);

  const displayArticles: DisplayArticle[] = list.map((a, i) => ({
    id: a.id,
    categoryKey: a.category,
    categoryLabel: catLabel(a.category),
    dateLabel: formatArticleDate(a.publishedAt, locale),
    readLabel: t('readTime', { minutes: a.readMinutes }),
    title: a.title,
    dek: a.dek,
    author: a.author,
    // Link to the locale where the translation actually exists, not the
    // current page locale. Prevents English-fallback cards on /pt/insight
    // from creating phantom /pt/insight/<en-slug> URLs that ISR would have
    // to render dynamically — the root cause of the DbTimeoutErrors.
    href: `/${a.translationLocale}/insight/${a.slug}`,
    imagePath: a.thumbnailUrl || a.coverImageUrl,
    indexLabel: String(i + 1).padStart(2, '0'),
  }));

  const tabs = [
    { key: 'all', label: t('all') },
    ...categories.map((c) => ({ key: c.key, label: c.name })),
  ];

  const insightUrl = localizedUrl(locale, '/insight');

  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${insightUrl}#blog`,
    name: t('heroTitle'),
    description: copy.description,
    url: insightUrl,
    inLanguage: locale,
    publisher: { '@id': `${SITE_URL}/#organization` },
    blogPost: list.slice(0, 30).map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: localizedUrl(locale, `/insight/${a.slug}`),
      datePublished: new Date(a.publishedAt).toISOString(),
      articleSection: catLabel(a.category),
      author: a.author
        ? { '@type': 'Person', name: a.author }
        : { '@id': `${SITE_URL}/#organization` },
      image: a.coverImageUrl ? getUploadUrl(a.coverImageUrl) : SITE_OG_IMAGE,
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('insight'), item: insightUrl },
    ],
  };

  return (
    <>
      <JsonLd id="ld-insight-blog" data={blogLd} />
      <JsonLd id="ld-insight-breadcrumb" data={breadcrumbLd} />

      {/* Masthead */}
      <section className="bg-cream">
        <div className="container-wide pt-14 md:pt-[88px] pb-12 md:pb-16">
          <p className="kicker" data-reveal>
            {t('kicker')}
          </p>
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

      <InsightIndex articles={displayArticles} tabs={tabs} />
    </>
  );
}
