import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { articles, articleTranslations } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { ChevronRight } from 'lucide-react';
import GalleryImage from '@/components/public/GalleryImage';
import ProductCard from '@/components/public/ProductCard';
import MoreStories from '@/components/public/insight/MoreStories';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  getArticleList,
  getArticleProducts,
  getArticleCategories,
  formatArticleDate,
  articleExcerpt,
  categoryFallbackLabel,
} from '@/lib/insight';
import { locales, defaultLocale } from '@/i18n/config';
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
  SITE_LOGO_URL,
  localeToOg,
  localizedPath,
  localizedUrl,
} from '@/lib/seo';
import { getUploadUrl } from '@/lib/utils';

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const db = getDb();
    const rows = await db
      .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
      .from(articleTranslations);
    return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const db = getDb();
    const joined = await db
      .select({ article: articles, trans: articleTranslations })
      .from(articleTranslations)
      .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
      .where(
        and(
          eq(articleTranslations.slug, slug),
          eq(articleTranslations.locale, locale),
          eq(articles.isActive, true),
        ),
      )
      .limit(1);

    const row = joined[0];
    if (!row) {
      // No translation in this locale — the page may still render the English
      // fallback, but it must not be indexed (avoids duplicate content).
      return { title: `Insight — ${SITE_NAME}`, robots: { index: false, follow: true } };
    }

    // hreflang built from the translations that actually exist.
    const allTrans = await db
      .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
      .from(articleTranslations)
      .where(eq(articleTranslations.articleId, row.article.id));

    const languages: Record<string, string> = {};
    for (const tr of allTrans) {
      if ((locales as readonly string[]).includes(tr.locale)) {
        languages[tr.locale] = localizedUrl(tr.locale, `/insight/${tr.slug}`);
      }
    }
    const def = allTrans.find((tr) => tr.locale === defaultLocale);
    if (def) languages['x-default'] = localizedUrl(defaultLocale, `/insight/${def.slug}`);

    const title = `${row.trans.title} — ${SITE_NAME}`;
    const description = row.trans.dek || articleExcerpt(row.trans.body);
    const canonical = localizedUrl(locale, `/insight/${slug}`);
    const ogImage = row.article.coverImageUrl
      ? getUploadUrl(row.article.coverImageUrl)
      : SITE_OG_IMAGE;

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: Object.keys(languages).length ? languages : undefined,
      },
      openGraph: {
        type: 'article',
        url: canonical,
        siteName: SITE_NAME,
        title,
        description,
        locale: localeToOg(locale),
        publishedTime: new Date(row.article.publishedAt).toISOString(),
        modifiedTime: new Date(row.article.updatedAt).toISOString(),
        authors: row.trans.author ? [row.trans.author] : undefined,
        images: [{ url: ogImage, width: 1200, height: 630, alt: row.trans.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: `Insight — ${SITE_NAME}` };
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('insight');
  const breadcrumbT = await getTranslations('breadcrumb');
  const db = getDb();

  const joined = await db
    .select({ article: articles, trans: articleTranslations })
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(
      and(
        eq(articleTranslations.slug, slug),
        eq(articleTranslations.locale, locale),
        eq(articles.isActive, true),
      ),
    )
    .limit(1);

  let article = joined[0]?.article;
  let translation = joined[0]?.trans;

  if (!article) {
    // Slug not present in this locale. Find it in any locale, then redirect
    // to the localized slug when one exists — same URL ↔ language consistency
    // rule as the product detail page. Otherwise render the found translation
    // as a fallback (metadata above already marks that case noindex).
    const any = await db
      .select({ article: articles, trans: articleTranslations })
      .from(articleTranslations)
      .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
      .where(and(eq(articleTranslations.slug, slug), eq(articles.isActive, true)))
      .limit(1);
    const target = any[0];
    if (!target) notFound();

    const localizedSlugRow = await db
      .select({ slug: articleTranslations.slug })
      .from(articleTranslations)
      .where(
        and(
          eq(articleTranslations.articleId, target.article.id),
          eq(articleTranslations.locale, locale),
        ),
      )
      .limit(1);

    if (localizedSlugRow[0]?.slug && localizedSlugRow[0].slug !== slug) {
      permanentRedirect(localizedPath(locale, `/insight/${localizedSlugRow[0].slug}`));
    }

    article = target.article;
    translation = target.trans;
  }
  if (!article || !translation) notFound();

  const [relatedProducts, allStories, categories] = await Promise.all([
    getArticleProducts(article.id, locale),
    getArticleList(locale),
    getArticleCategories(locale),
  ]);
  const moreStories = allStories.filter((a) => a.id !== article.id).slice(0, 3);
  const catMap = new Map(categories.map((c) => [c.key, c.name]));
  const catLabel = (key: string) => catMap.get(key) ?? categoryFallbackLabel(key);

  const categoryLabel = catLabel(article.category);
  const dateLabel = formatArticleDate(article.publishedAt, locale);
  const readLabel = t('readTime', { minutes: article.readMinutes });

  const articleUrl = localizedUrl(locale, `/insight/${slug}`);
  const blogPostingLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${articleUrl}#article`,
    headline: translation.title,
    description: translation.dek || articleExcerpt(translation.body, 500),
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
      name: SITE_NAME,
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
      <JsonLd id="ld-article" data={blogPostingLd} />
      <JsonLd id="ld-article-breadcrumb" data={breadcrumbLd} />

      {/* Breadcrumb */}
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
              <Link href={`/${locale}/insight`} className="text-ink-mid hover:text-ink transition-colors duration-300">
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
        {/* Masthead — centered print title block */}
        <header className="container-wide pt-12 md:pt-16">
          <div className="max-w-[780px] mx-auto text-center">
            <div className="flex flex-wrap items-baseline justify-center gap-x-3.5 gap-y-1.5 text-[12px] font-body uppercase">
              <span className="font-semibold tracking-[0.16em] text-bronze">{categoryLabel}</span>
              <span aria-hidden className="text-ink-light">·</span>
              <span className="tracking-[0.1em] text-ink-mid">{dateLabel}</span>
              <span aria-hidden className="text-ink-light">·</span>
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

        {/* Lead image — mounted-print hairline frame */}
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

        {/* Body — primary indexable copy, never gated behind reveals */}
        <div className="container-narrow pt-12 md:pt-16 pb-16 md:pb-20">
          <div
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: translation.body || '' }}
          />
        </div>

        {/* Products featured in this story */}
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
        allStoriesHref={`/${locale}/insight`}
        items={moreStories.map((m) => ({
          href: `/${locale}/insight/${m.slug}`,
          categoryLabel: catLabel(m.category),
          dateLabel: formatArticleDate(m.publishedAt, locale),
          title: m.title,
        }))}
      />
    </>
  );
}
