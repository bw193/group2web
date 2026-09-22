import type { Metadata } from 'next';
import {
  getArticleBody,
  getArticleRouteData,
  getArticleAllTranslations,
  getArticleStaticParams,
} from '@/lib/insight';
import { locales, defaultLocale } from '@/i18n/config';
import { isIndexableLocalePath } from '@/lib/indexing';
import {
  SITE_OG_IMAGE,
  leadingProse,
  localeToOg,
  localizedSiteName,
  localizedUrl,
  pageCopy,
  snippet,
  titleWithSiteName,
} from '@/lib/seo';
import { getUploadUrl } from '@/lib/utils';
import { insightArticlePathAfterLocale } from '@/lib/public-paths';
import { renderArticlePage, type ArticlePageProps } from './ArticleDetailRoute';

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getArticleStaticParams()).filter((p) => p.locale !== 'he');
}

/**
 * hreflang and canonical both name /insight/<category>/<slug>. The category is
 * a property of the article, shared by every translation, so one lookup covers
 * all locales.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteName = localizedSiteName(locale);

  try {
    const row = await getArticleRouteData(locale, slug);
    if (!row) {
      return { title: `Insight - ${siteName}`, robots: { index: false, follow: true } };
    }

    const allTrans = await getArticleAllTranslations(row.article.id);

    // Skip locales whose page is noindex at this path (Hebrew detail pages) —
    // hreflang must never point at a URL we've asked not to be indexed.
    const languages: Record<string, string> = {};
    for (const tr of allTrans) {
      if (!(locales as readonly string[]).includes(tr.locale)) continue;
      const trPath = insightArticlePathAfterLocale(row.article.category, tr.slug);
      if (!isIndexableLocalePath(tr.locale, trPath)) continue;
      languages[tr.locale] = localizedUrl(tr.locale, trPath);
    }
    const def = allTrans.find((tr) => tr.locale === defaultLocale);
    if (def) {
      languages['x-default'] = localizedUrl(
        defaultLocale,
        insightArticlePathAfterLocale(row.article.category, def.slug),
      );
    }

    const title = titleWithSiteName(row.trans.title, siteName);
    // Articles without a dek used to fall back to the Insight index description,
    // so nine English articles shared one meta description (F-08 in the
    // 2026-09-15 SEO audit). Their own opening prose is unique to each page.
    const body = row.trans.dek ? null : await getArticleBody(row.trans.id);
    const description =
      snippet(row.trans.dek || leadingProse(body)) || pageCopy(locale, 'insight').description;
    const canonical = localizedUrl(
      locale,
      insightArticlePathAfterLocale(row.article.category, row.trans.slug),
    );
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
        siteName,
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
    return { title: `Insight - ${siteName}` };
  }
}

export default async function ArticlePage(props: ArticlePageProps) {
  return renderArticlePage(props, { redirectHebrewSegment: true });
}
