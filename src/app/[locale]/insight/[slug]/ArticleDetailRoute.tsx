import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';
import { LocaleSwitchLinks } from '@/components/public/LocaleSwitchLinks';
import ProductCard from '@/components/public/ProductCard';
import MoreStories from '@/components/public/insight/MoreStories';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  getArticleRouteData,
  getArticleAllTranslations,
  getArticleBody,
  getArticleProducts,
  getArticleCategories,
  getArticleMissingLocaleRedirect,
  getMoreStories,
  formatArticleDate,
  articleExcerpt,
  categoryFallbackLabel,
} from '@/lib/insight';
import {
  SITE_OG_IMAGE,
  SITE_URL,
  SITE_LOGO_URL,
  localizedSiteName,
  localizedPath,
  localizedUrl,
} from '@/lib/seo';
import { buildArticleLocaleSwitchLinks } from '@/lib/locale-switch-links';
import { getUploadUrl } from '@/lib/utils';

export type ArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function renderArticlePage(
  { params }: ArticlePageProps,
  options: { redirectHebrewSegment?: boolean } = {},
) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('insight');
  const breadcrumbT = await getTranslations('breadcrumb');

  const row = await getArticleRouteData(locale, slug);

  if (!row) {
    const destination = await getArticleMissingLocaleRedirect(locale, slug);
    if (!destination) notFound();
    permanentRedirect(destination);
  }

  const { article, trans: translation } = row;
  const siteName = localizedSiteName(locale);
  if (options.redirectHebrewSegment && locale === 'he') {
    permanentRedirect(localizedPath(locale, `/insight/${translation.slug}`));
  }

  const body = await getArticleBody(translation.id);
  const relatedProducts = await getArticleProducts(article.id, locale);
  const moreStories = await getMoreStories(locale, article.id, 3);
  const categories = await getArticleCategories(locale);
  const allTranslations = await getArticleAllTranslations(article.id);
  const localeSwitchLinks = buildArticleLocaleSwitchLinks(allTranslations);
  const catMap = new Map(categories.map((c) => [c.key, c.name]));
  const catLabel = (key: string) => catMap.get(key) ?? categoryFallbackLabel(key);

  const categoryLabel = catLabel(article.category);
  const dateLabel = formatArticleDate(article.publishedAt, locale);
  const readLabel = t('readTime', { minutes: article.readMinutes });

  const articleUrl = localizedUrl(locale, `/insight/${translation.slug}`);
  const blogPostingLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${articleUrl}#article`,
    headline: translation.title,
    description: translation.dek || articleExcerpt(body, 500),
    articleSection: categoryLabel,
    inLanguage: locale,
    datePublished: new Date(article.publishedAt).toISOString(),
    dateModified: new Date(article.updatedAt).toISOString(),
    author: translation.author
      ? { '@type': 'Person', name: translation.author }
      : { '@id': `${SITE_URL}/#organization` },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: siteName,
      logo: { '@type': 'ImageObject', url: SITE_LOGO_URL },
    },
    image: article.coverImageUrl ? [getUploadUrl(article.coverImageUrl)] : [SITE_OG_IMAGE],
    url: articleUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('insight'), item: localizedUrl(locale, '/insight') },
      { '@type': 'ListItem', position: 3, name: translation.title, item: articleUrl },
    ],
  };

  return (
    <>
      <LocaleSwitchLinks links={localeSwitchLinks} />
      <JsonLd id="ld-article" data={blogPostingLd} />
      <JsonLd id="ld-article-breadcrumb" data={breadcrumbLd} />

      <nav aria-label="Breadcrumb" className="bg-cream border-b border-warm-border">
        <div className="container-wide py-4">
          <ol className="flex items-center gap-2.5 text-[12px] font-body font-semibold tracking-[0.12em] uppercase">
            <li className="flex-shrink-0">
              <Link href={localizedPath(locale, '')} className="text-ink-mid hover:text-ink transition-colors duration-300">
                {breadcrumbT('home')}
              </Link>
            </li>
            <li aria-hidden className="flex-shrink-0 text-ink-light">
              <ChevronRight size={13} strokeWidth={2} className="rtl:-scale-x-100" />
            </li>
            <li className="flex-shrink-0">
              <Link href={localizedPath(locale, '/insight')} className="text-ink-mid hover:text-ink transition-colors duration-300">
                {breadcrumbT('insight')}
              </Link>
            </li>
            <li aria-hidden className="flex-shrink-0 text-ink-light">
              <ChevronRight size={13} strokeWidth={2} className="rtl:-scale-x-100" />
            </li>
            <li className="min-w-0 truncate text-ink" aria-current="page">
              {translation.title}
            </li>
          </ol>
        </div>
      </nav>

      <article className="bg-cream">
        <header className="container-wide pt-12 md:pt-16">
          <div className="max-w-[780px] mx-auto text-center">
            <div className="flex flex-wrap items-baseline justify-center gap-x-3.5 gap-y-1.5 text-[12px] font-body uppercase">
              <span className="font-semibold tracking-[0.16em] text-bronze">{categoryLabel}</span>
              <span aria-hidden className="text-ink-light">-</span>
              <span className="tracking-[0.1em] text-ink-mid">{dateLabel}</span>
              <span aria-hidden className="text-ink-light">-</span>
              <span className="tracking-[0.1em] text-ink-mid whitespace-nowrap">{readLabel}</span>
            </div>
            <h1 className="mt-6 font-display font-light text-ink text-[clamp(2.3rem,4.8vw,3.7rem)] leading-[1.06] tracking-[-0.02em]">
              {translation.title}
            </h1>
            {translation.dek && (
              <p className="mt-6 mx-auto max-w-[54ch] font-body text-[18px] md:text-[19px] leading-[1.65] text-ink-mid">
                {translation.dek}
              </p>
            )}
            {translation.author && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <span className="w-10 h-px bg-warm-border" aria-hidden />
                <span className="text-[12px] font-body font-semibold tracking-[0.18em] uppercase text-ink">
                  {translation.author}
                </span>
                <span className="w-10 h-px bg-warm-border" aria-hidden />
              </div>
            )}
          </div>
        </header>

        {article.coverImageUrl && (
          <div className="container-wide pt-12 md:pt-14">
            <div className="relative w-full max-w-[1080px] mx-auto aspect-[16/9] overflow-hidden bg-sand">
              <GalleryImage
                path={article.coverImageUrl}
                alt={translation.title}
                fill
                priority
                sizes="(max-width: 1080px) 100vw, 1080px"
                className="object-cover"
              />
              <span className="absolute inset-3 md:inset-4 border border-white/35 pointer-events-none z-[1]" />
            </div>
          </div>
        )}

        <div className="container-narrow pt-12 md:pt-16 pb-16 md:pb-20">
          <div
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: body || '' }}
          />
        </div>

        {relatedProducts.length > 0 && (
          <div className="container-wide pb-20 md:pb-24">
            <div className="border-t border-warm-border pt-12 md:pt-14">
              <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1] mb-10">
                {t('featuredProducts')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 md:gap-x-10 md:gap-y-16">
                {relatedProducts.map((p, i) => (
                  <ProductCard key={p.id} index={i} {...p} />
                ))}
              </div>
            </div>
          </div>
        )}
      </article>

      <MoreStories
        heading={t('continueReading')}
        allStoriesLabel={t('back')}
        allStoriesHref={localizedPath(locale, '/insight')}
        items={moreStories.map((m) => ({
          href: localizedPath(m.translationLocale, `/insight/${m.slug}`),
          categoryLabel: catLabel(m.category),
          dateLabel: formatArticleDate(m.publishedAt, locale),
          title: m.title,
        }))}
      />
    </>
  );
}
