import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  getArticleCategories,
  getArticleMissingLocaleRedirect,
  getArticleRouteData,
  getInsightIndexData,
  categoryFallbackLabel,
  formatArticleDate,
} from '@/lib/insight';
import { insightCategoryCopy } from '@/lib/insight-category-copy';
import InsightIndex from '@/components/public/insight/InsightIndex';
import type { DisplayArticle } from '@/components/public/insight/types';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  SITE_OG_IMAGE,
  SITE_URL,
  buildAlternates,
  localeToOg,
  localizedSiteName,
  localizedUrl,
  pageCopy,
  snippet,
  titleWithSiteName,
} from '@/lib/seo';
import {
  categoryKeyFromSegment,
  insightArticlePathAfterLocale,
  insightCategoryPathAfterLocale,
  localizedPath,
} from '@/lib/public-paths';
import { getUploadUrl } from '@/lib/utils';

/**
 * One landing page per Insight category, and the home of the old flat article
 * URLs: /insight/<segment> is a category when the segment is a category key,
 * and otherwise an article that has moved to /insight/<category>/<slug> and
 * gets a permanent redirect.
 *
 * The body lives here rather than in page.tsx because a page module may only
 * export Next's own names, and the Hebrew mirror route needs to call it — the
 * same split as ArticleDetailRoute.tsx next door.
 */
type CategoryPageProps = { params: Promise<{ locale: string; category: string }> };

export type { CategoryPageProps };

async function resolveCategory(locale: string, segment: string) {
  const key = categoryKeyFromSegment(locale, segment);
  const { list, categories } = await getInsightIndexData(locale);
  const category = categories.find((c) => c.key === key);
  if (!category) return null;
  return { category, articles: list.filter((a) => a.category === key) };
}

export async function categoryMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, category: segment } = await params;
  const siteName = localizedSiteName(locale);

  try {
    const resolved = await resolveCategory(locale, segment);
    // A moved article or an unknown segment: the page itself redirects or
    // 404s, so keep its interim metadata out of the index.
    if (!resolved || resolved.articles.length === 0) {
      return { title: `${pageCopy(locale, 'insight').title}`, robots: { index: false, follow: true } };
    }

    const { category } = resolved;
    const copy = insightCategoryCopy(locale, category.key);
    const heading = copy?.heading ?? category.name;
    const description = snippet(copy?.intro ?? pageCopy(locale, 'insight').description);
    const pathAfterLocale = insightCategoryPathAfterLocale(category.key);
    const url = localizedUrl(locale, pathAfterLocale);
    const title = titleWithSiteName(heading, siteName);

    return {
      title,
      description,
      alternates: buildAlternates(locale, pathAfterLocale),
      openGraph: {
        type: 'website',
        url,
        siteName,
        title,
        description,
        locale: localeToOg(locale),
        images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: siteName }],
      },
      twitter: { card: 'summary_large_image', title, description, images: [SITE_OG_IMAGE] },
    };
  } catch {
    return { title: pageCopy(locale, 'insight').title };
  }
}

export async function renderCategoryPage(
  { params }: CategoryPageProps,
  options: { redirectHebrewSegment?: boolean } = {},
) {
  const { locale, category: segment } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('insight');
  const breadcrumbT = await getTranslations('breadcrumb');

  const resolved = await resolveCategory(locale, segment);

  // Not a category, so this is one of the old flat article URLs: send it to
  // the article's new home under its category, permanently.
  if (!resolved) {
    const row = await getArticleRouteData(locale, segment);
    if (row) {
      permanentRedirect(
        localizedPath(locale, insightArticlePathAfterLocale(row.article.category, row.trans.slug)),
      );
    }
    const moved = await getArticleMissingLocaleRedirect(locale, segment);
    if (moved) permanentRedirect(moved);
    notFound();
  }

  const { category, articles } = resolved;
  const pathAfterLocale = insightCategoryPathAfterLocale(category.key);

  if (options.redirectHebrewSegment && locale === 'he') {
    permanentRedirect(localizedPath(locale, pathAfterLocale));
  }

  // A category with nothing published is not a page worth serving or
  // indexing; the index lists every story anyway.
  if (articles.length === 0) redirect(localizedPath(locale, '/insight'));

  const copy = insightCategoryCopy(locale, category.key);
  const heading = copy?.heading ?? category.name;
  const intro = copy?.intro ?? pageCopy(locale, 'insight').description;

  const allCategories = await getArticleCategories(locale);
  const { list } = await getInsightIndexData(locale);
  const stocked = new Set(list.map((a) => a.category));
  const tabs = [
    { key: 'all', label: t('all'), href: localizedPath(locale, '/insight') },
    ...allCategories
      .filter((c) => stocked.has(c.key))
      .map((c) => ({
        key: c.key,
        label: c.name,
        href: localizedPath(locale, insightCategoryPathAfterLocale(c.key)),
      })),
  ];

  const catMap = new Map(allCategories.map((c) => [c.key, c.name]));
  const catLabel = (key: string) => catMap.get(key) ?? categoryFallbackLabel(key);

  const displayArticles: DisplayArticle[] = articles.map((a) => ({
    id: a.id,
    categoryKey: a.category,
    categoryLabel: catLabel(a.category),
    dateLabel: formatArticleDate(a.publishedAt, locale),
    readLabel: t('readTime', { minutes: a.readMinutes }),
    title: a.title,
    dek: a.dek,
    author: a.author,
    // Link to the locale that owns the translation, as the index does, so a
    // fallback card never invents a URL this locale cannot render.
    href: localizedPath(a.translationLocale, insightArticlePathAfterLocale(a.category, a.slug)),
    imagePath: a.thumbnailUrl || a.coverImageUrl,
  }));

  const categoryUrl = localizedUrl(locale, pathAfterLocale);
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${categoryUrl}#collection`,
    name: heading,
    description: intro,
    url: categoryUrl,
    inLanguage: locale,
    isPartOf: { '@id': `${localizedUrl(locale, '/insight')}#blog` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.slice(0, 30).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: localizedUrl(a.translationLocale, insightArticlePathAfterLocale(a.category, a.slug)),
        name: a.title,
        image: a.coverImageUrl ? getUploadUrl(a.coverImageUrl) : SITE_OG_IMAGE,
      })),
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('insight'), item: localizedUrl(locale, '/insight') },
      { '@type': 'ListItem', position: 3, name: category.name, item: categoryUrl },
    ],
  };

  return (
    <>
      <JsonLd id="ld-insight-category" data={collectionLd} />
      <JsonLd id="ld-insight-category-breadcrumb" data={breadcrumbLd} />

      {/* Masthead — same rhythm as the index, with the category's own H1 and
          the sentence that also serves as its search snippet. */}
      <section className="bg-cream">
        <div className="container-wide pt-14 md:pt-[88px] pb-12 md:pb-16">
          <p className="kicker" data-reveal>
            {t('kicker')} — {category.name}
          </p>
          <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <h1
              className="lg:col-span-8 font-display font-light text-ink text-[clamp(2.9rem,6.6vw,5.4rem)] leading-[0.98] tracking-[-0.025em] max-w-[15ch]"
              data-reveal
            >
              {heading}
            </h1>
            <div className="lg:col-span-4 lg:text-end" data-reveal>
              <p className="font-body text-[16px] md:text-[17px] leading-[1.65] text-ink-mid max-w-[36ch] lg:ms-auto">
                {intro}
              </p>
            </div>
          </div>
        </div>
      </section>

      <InsightIndex articles={displayArticles} tabs={tabs} activeKey={category.key} />
    </>
  );
}
