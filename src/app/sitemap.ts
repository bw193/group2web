import type { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';
import { productTranslations, products, articleTranslations, articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getBuildSnapshot } from '@/lib/build-cache';
import { locales, defaultLocale } from '@/i18n/config';
import {
  localizedUrl,
  buildLanguageAlternates,
} from '@/lib/seo';

// Stable date for static routes so Google doesn't see every locale homepage
// "changing" on each rebuild. Bump manually when nav/footer/structure shifts.
const STATIC_LAST_MODIFIED = new Date('2026-05-20T00:00:00Z');

// Static routes shared across every locale, expressed as the path segment
// AFTER the (optional) locale prefix. Use '' for the locale's homepage.
const STATIC_ROUTES = ['', '/about', '/contact', '/products', '/insight'] as const;

type SitemapRow = {
  locale: string;
  slug: string;
  itemId: number;
  updatedAt: string;
  isActive: boolean;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static routes × every locale.
  for (const pathAfterLocale of STATIC_ROUTES) {
    const languages = buildLanguageAlternates(pathAfterLocale);
    for (const loc of locales) {
      entries.push({
        url: localizedUrl(loc, pathAfterLocale),
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: pathAfterLocale === '' ? 'weekly' : 'monthly',
        priority: pathAfterLocale === '' ? 1.0 : 0.7,
        alternates: { languages },
      });
    }
  }

  const snap = await getBuildSnapshot();

  // Dynamic product detail pages. Slugs are stored per-locale in
  // product_translations.
  let productRows: SitemapRow[];
  if (snap) {
    productRows = snap.productTranslations.flatMap((t) => {
      const p = snap.indices.productById.get(t.productId);
      return p
        ? [{ locale: t.locale, slug: t.slug, itemId: t.productId, updatedAt: p.updatedAt, isActive: p.isActive }]
        : [];
    });
  } else {
    // No try/catch — per [[no-fallback-masking]] a DB outage should crash
    // the build, not silently emit a sitemap missing every product URL.
    const db = getDb();
    const rows = await db
      .select({
        locale: productTranslations.locale,
        slug: productTranslations.slug,
        productId: productTranslations.productId,
        updatedAt: products.updatedAt,
        isActive: products.isActive,
      })
      .from(productTranslations)
      .innerJoin(products, eq(products.id, productTranslations.productId));
    productRows = rows.map((r) => ({
      locale: r.locale,
      slug: r.slug,
      itemId: r.productId,
      updatedAt: r.updatedAt,
      isActive: r.isActive,
    }));
  }
  pushHreflangGroup(entries, productRows, 'products', 0.8);

  // Dynamic Insight article pages. Per-locale (locale, slug) live in
  // article_translations; the body lives in article_translation_bodies and is
  // never selected here (light, product-like). One entry per locale that has a
  // real translation, with hreflang alternates grouped by article.
  let articleRows: SitemapRow[];
  if (snap) {
    articleRows = snap.articleTranslations.flatMap((t) => {
      const a = snap.indices.articleById.get(t.articleId);
      return a
        ? [{ locale: t.locale, slug: t.slug, itemId: t.articleId, updatedAt: a.updatedAt, isActive: a.isActive }]
        : [];
    });
  } else {
    const db = getDb();
    const rows = await db
      .select({
        locale: articleTranslations.locale,
        slug: articleTranslations.slug,
        articleId: articleTranslations.articleId,
        updatedAt: articles.updatedAt,
        isActive: articles.isActive,
      })
      .from(articleTranslations)
      .innerJoin(articles, eq(articles.id, articleTranslations.articleId));
    articleRows = rows.map((r) => ({
      locale: r.locale,
      slug: r.slug,
      itemId: r.articleId,
      updatedAt: r.updatedAt,
      isActive: r.isActive,
    }));
  }
  pushHreflangGroup(entries, articleRows, 'insight', 0.7);

  return entries;
}

/**
 * Group per-locale rows by item, build the hreflang `languages` map from each
 * item's per-locale slugs, and emit one sitemap entry per (item, locale).
 * Inactive items are skipped — matches the legacy SQL-then-filter behavior.
 */
function pushHreflangGroup(
  entries: MetadataRoute.Sitemap,
  rows: SitemapRow[],
  pathSegment: 'products' | 'insight',
  priority: number,
) {
  const byItem = new Map<number, { updatedAt: string; isActive: boolean; slugs: Record<string, string> }>();
  for (const r of rows) {
    const existing = byItem.get(r.itemId) ?? {
      updatedAt: r.updatedAt,
      isActive: r.isActive,
      slugs: {} as Record<string, string>,
    };
    existing.slugs[r.locale] = r.slug;
    byItem.set(r.itemId, existing);
  }

  for (const [, { updatedAt, isActive, slugs }] of byItem) {
    if (!isActive) continue;

    // Build hreflang languages map from this item's per-locale slugs.
    const languages: Record<string, string> = {};
    for (const loc of locales) {
      const slug = slugs[loc];
      if (slug) {
        languages[loc] = localizedUrl(loc, `/${pathSegment}/${slug}`);
      }
    }
    const defaultSlug = slugs[defaultLocale];
    if (defaultSlug) {
      languages['x-default'] = localizedUrl(defaultLocale, `/${pathSegment}/${defaultSlug}`);
    }

    // Emit one sitemap entry per locale that actually has a translation.
    for (const loc of locales) {
      const slug = slugs[loc];
      if (!slug) continue;
      const lastModified = updatedAt ? new Date(updatedAt) : STATIC_LAST_MODIFIED;
      entries.push({
        url: localizedUrl(loc, `/${pathSegment}/${slug}`),
        lastModified: Number.isNaN(lastModified.getTime()) ? STATIC_LAST_MODIFIED : lastModified,
        changeFrequency: 'monthly',
        priority,
        alternates: { languages },
      });
    }
  }
}
