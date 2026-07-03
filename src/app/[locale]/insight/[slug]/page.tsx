import type { Metadata } from 'next';
import {
  getArticleRouteData,
  getArticleAllTranslations,
  getArticleStaticParams,
} from '@/lib/insight';
import { locales, defaultLocale } from '@/i18n/config';
import {
  SITE_OG_IMAGE,
  localeToOg,
  localizedSiteName,
  localizedUrl,
  pageCopy,
  shouldIncludeSeoAlternate,
  shouldIncludeXDefault,
} from '@/lib/seo';
import { getUploadUrl } from '@/lib/utils';
import { renderArticlePage, type ArticlePageProps } from './ArticleDetailRoute';

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getArticleStaticParams()).filter((p) => p.locale !== 'he');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteName = localizedSiteName(locale);

  try {
    const row = await getArticleRouteData(locale, slug);
    if (!row) {
      return { title: `Insight - ${siteName}`, robots: { index: false, follow: true } };
    }

    const allTrans = await getArticleAllTranslations(row.article.id);

    const languages: Record<string, string> = {};
    for (const tr of allTrans) {
      if ((locales as readonly string[]).includes(tr.locale) && shouldIncludeSeoAlternate(locale, tr.locale)) {
        languages[tr.locale] = localizedUrl(tr.locale, `/insight/${tr.slug}`);
      }
    }
    const def = allTrans.find((tr) => tr.locale === defaultLocale);
    if (def && shouldIncludeXDefault(locale)) languages['x-default'] = localizedUrl(defaultLocale, `/insight/${def.slug}`);

    const title = `${row.trans.title} - ${siteName}`;
    const description = row.trans.dek || pageCopy(locale, 'insight').description;
    const canonical = localizedUrl(locale, `/insight/${row.trans.slug}`);
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
