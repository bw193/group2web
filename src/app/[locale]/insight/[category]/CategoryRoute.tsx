import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import InsightIndex from '@/components/public/insight/InsightIndex';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  type ArticleCategory,
  articleListItemPath,
  categoryTabs,
  getArticleMissingLocaleRedirect,
  getArticleRouteData,
  getInsightIndexData,
  toDisplayArticles,
} from '@/lib/insight';
import { insightCategoryCopy, type InsightCategoryCopy } from '@/lib/insight-category-copy';
import {
  categoryKeyFromSegment,
  insightArticlePathAfterLocale,
  insightCategoryPathAfterLocale,
  insightCategorySegment,
  localizedPath,
} from '@/lib/public-paths';
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
import { getUploadUrl } from '@/lib/utils';

/**
 * /insight/<segment> — one landing page per Insight category, and the home of
 * the flat article URLs from before categories had pages.
 *
 * A segment that names a category renders its landing page. Anything else is
 * treated as an old /insight/<slug> link: the article is resolved (current
 * slug, slug history, or another locale's slug) and sent to
 * /insight/<category>/<slug> in one permanent redirect, never a chain. An
 * unknown segment 404s.
 *
 * Lives outside page.tsx because a page module may only export Next's own
 * names, and the Hebrew mirror route renders it too — the same split as
 * ArticleDetailRoute.tsx.
 */
export type CategoryPageProps = { params: Promise<{ locale: string; category: string }> };

async function loadCategory(locale: string, segment: string) {
  const { list, categories } = await getInsightIndexData(locale);
  const key = categoryKeyFromSegment(locale, segment);
  const category = categories.find((c) => c.key === key) ?? null;
  const articles = category ? list.filter((a) => a.category === category.key) : [];
  return { list, categories, category, articles };
}

/** A category added in the CMS after the copy file still gets a usable page. */
function landingCopy(locale: string, category: ArticleCategory): InsightCategoryCopy {
  return (
    insightCategoryCopy(locale, category.key) ?? {
      title: category.name,
      heading: category.name,
      intro: pageCopy(locale, 'insight').description,
    }
  );
}

export async function categoryMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, category: segment } = await params;
  const siteName = localizedSiteName(locale);

  try {
    const { category, articles } = await loadCategory(locale, segment);
    // The page itself redirects or 404s here; nothing to index in between.
    if (!category || articles.length === 0) return { robots: { index: false, follow: true } };

    const copy = landingCopy(locale, category);
    const pathAfterLocale = insightCategoryPathAfterLocale(category.key);
    const url = localizedUrl(locale, pathAfterLocale);
    const title = titleWithSiteName(copy.title, siteName);
    const description = snippet(copy.intro);

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
  const [t, breadcrumbT] = await Promise.all([
    getTranslations('insight'),
    getTranslations('breadcrumb'),
  ]);

  const { list, categories, category, articles } = await loadCategory(locale, segment);

  if (!category) {
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

  const pathAfterLocale = insightCategoryPathAfterLocale(category.key);
  // One category, one URL: a Hebrew request on the generic route, or a
  // segment in the wrong form for this locale, goes to the canonical URL.
  if (
    (options.redirectHebrewSegment && locale === 'he') ||
    segment !== insightCategorySegment(locale, category.key)
  ) {
    permanentRedirect(localizedPath(locale, pathAfterLocale));
  }
  // Nothing published yet: no page worth serving or indexing, and the index
  // already lists every story. Temporary, because the category will fill.
  if (articles.length === 0) redirect(localizedPath(locale, '/insight'));

  const copy = landingCopy(locale, category);
  const displayArticles = toDisplayArticles(articles, categories, locale, (minutes) =>
    t('readTime', { minutes }),
  );
  const tabs = categoryTabs(locale, list, categories, t('all'));

  const insightUrl = localizedUrl(locale, '/insight');
  const categoryUrl = localizedUrl(locale, pathAfterLocale);

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${categoryUrl}#collection`,
    name: copy.heading,
    description: copy.intro,
    url: categoryUrl,
    inLanguage: locale,
    isPartOf: { '@id': `${insightUrl}#blog` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.slice(0, 30).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${articleListItemPath(a)}`,
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
      { '@type': 'ListItem', position: 2, name: breadcrumbT('insight'), item: insightUrl },
      { '@type': 'ListItem', position: 3, name: category.name, item: categoryUrl },
    ],
  };

  return (
    <>
      <JsonLd id="ld-insight-category" data={collectionLd} />
      <JsonLd id="ld-insight-category-breadcrumb" data={breadcrumbLd} />

      {/* Masthead — the index's rhythm, with the category's own H1 and the
          sentence that is also its search snippet. */}
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
              {copy.heading}
            </h1>
            <div className="lg:col-span-4 lg:text-end" data-reveal>
              <p className="font-body text-[16px] md:text-[17px] leading-[1.65] text-ink-mid max-w-[36ch] lg:ms-auto">
                {copy.intro}
              </p>
            </div>
          </div>
        </div>
      </section>

      <InsightIndex articles={displayArticles} tabs={tabs} activeKey={category.key} />
    </>
  );
}
