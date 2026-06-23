import 'server-only';
import { getDb } from '@/lib/db';
import { defaultLocale } from '@/i18n/config';
import {
  articles,
  articleTranslations,
  articleTranslationBodies,
  articleProducts,
  articleCategories,
  articleCategoryTranslations,
  products,
  productTranslations,
  productImages,
} from '@/lib/db/schema';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { getPublicDataSnapshot } from '@/lib/public-data-snapshot';
import type { PublicDataSnapshot } from '@/lib/public-data-snapshot';
import { localizedPath } from '@/lib/seo';

// Insight reads mirror the product pages: direct, batched Drizzle queries on
// the shared pool, cached only by page-level ISR. Critically, the list /
// index / metadata / more-stories paths NEVER select `body` — the heavy
// article HTML lives in article_translation_bodies and is loaded only by the
// detail page (getArticleBody). That keeps article_translations as light as
// product_translations so static generation of all 7 locales stays cheap.

export interface ArticleCategory {
  key: string;
  name: string;
}

/** Title-cased key, the last-resort label when no translation row exists. */
export function categoryFallbackLabel(key: string): string {
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : key;
}

function getSnapshot(): PublicDataSnapshot | null {
  return getPublicDataSnapshot();
}

function byDisplayOrder<T extends { displayOrder: number; id?: number }>(a: T, b: T) {
  return a.displayOrder - b.displayOrder || (a.id ?? 0) - (b.id ?? 0);
}

function getSnapshotCategories(snapshot: PublicDataSnapshot, locale: string): ArticleCategory[] {
  const cats = snapshot.data.articleCategories.slice().sort(byDisplayOrder);
  const byCat = new Map<number, Map<string, string>>();
  for (const t of snapshot.data.articleCategoryTranslations) {
    const m = byCat.get(t.categoryId) ?? new Map<string, string>();
    m.set(t.locale, t.name);
    byCat.set(t.categoryId, m);
  }

  return cats.map((c) => {
    const names = byCat.get(c.id);
    return {
      key: c.key,
      name: names?.get(locale) || names?.get(defaultLocale) || categoryFallbackLabel(c.key),
    };
  });
}

/**
 * CMS-managed categories for a locale, in editor order, with the usual English
 * fallback per name (then the title-cased key). Returns [] only for the
 * legitimate empty case (no rows); a DB failure throws so the caller fails
 * loudly instead of silently dropping the tabs.
 */
export async function getArticleCategories(locale: string): Promise<ArticleCategory[]> {
  const snapshot = getSnapshot();
  if (snapshot) {
    return getSnapshotCategories(snapshot, locale);
  }

  const db = getDb();
  const cats = await db
    .select()
    .from(articleCategories)
    .orderBy(articleCategories.displayOrder, articleCategories.id);
  if (cats.length === 0) return [];

  const trans = await db
    .select()
    .from(articleCategoryTranslations)
    .where(inArray(articleCategoryTranslations.categoryId, cats.map((c) => c.id)));

  const byCat = new Map<number, Map<string, string>>();
  for (const t of trans) {
    const m = byCat.get(t.categoryId) ?? new Map<string, string>();
    m.set(t.locale, t.name);
    byCat.set(t.categoryId, m);
  }

  return cats.map((c) => {
    const names = byCat.get(c.id);
    return {
      key: c.key,
      name: names?.get(locale) || names?.get('en') || categoryFallbackLabel(c.key),
    };
  });
}

export interface ArticleListItem {
  id: number;
  category: string;
  slug: string;
  title: string;
  dek: string | null;
  author: string | null;
  readMinutes: number;
  publishedAt: string;
  coverImageUrl: string | null;
  thumbnailUrl: string | null;
  // The locale that produced this row's translation. Equal to the requested
  // locale when its own translation exists, otherwise 'en' (the fallback).
  translationLocale: string;
}

// Light translation projection — the column set every list/route path selects.
// It deliberately excludes `body` (which lives in article_translation_bodies).
const listTransColumns = {
  articleId: articleTranslations.articleId,
  locale: articleTranslations.locale,
  slug: articleTranslations.slug,
  title: articleTranslations.title,
  dek: articleTranslations.dek,
  author: articleTranslations.author,
} as const;

type ListTrans = {
  articleId: number;
  locale: string;
  slug: string;
  title: string;
  dek: string | null;
  author: string | null;
};

function byArticleDateDesc(a: typeof articles.$inferSelect, b: typeof articles.$inferSelect) {
  const dateDiff = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  return dateDiff || b.id - a.id;
}

function snapshotListTranslations(
  snapshot: PublicDataSnapshot,
  articleIds: number[],
  locale: string,
): ListTrans[] {
  const wanted = new Set(locale === defaultLocale ? [defaultLocale] : [locale, defaultLocale]);
  const idSet = new Set(articleIds);
  return snapshot.data.articleTranslations
    .filter((t) => idSet.has(t.articleId) && wanted.has(t.locale))
    .map((t) => ({
      articleId: t.articleId,
      locale: t.locale,
      slug: t.slug,
      title: t.title,
      dek: t.dek,
      author: t.author,
    }));
}

function toListItem(a: typeof articles.$inferSelect, t: ListTrans): ArticleListItem {
  return {
    id: a.id,
    category: a.category,
    slug: t.slug,
    title: t.title,
    dek: t.dek,
    author: t.author,
    readMinutes: a.readMinutes,
    publishedAt: a.publishedAt,
    coverImageUrl: a.coverImageUrl,
    thumbnailUrl: a.thumbnailUrl,
    translationLocale: t.locale,
  };
}

// Resolve each article to its locale translation, falling back to English;
// articles with neither are dropped.
function resolveList(
  base: (typeof articles.$inferSelect)[],
  allTrans: ListTrans[],
  locale: string,
): ArticleListItem[] {
  const transMap = new Map(allTrans.filter((t) => t.locale === locale).map((t) => [t.articleId, t]));
  const transEnMap = new Map(allTrans.filter((t) => t.locale === 'en').map((t) => [t.articleId, t]));
  return base.flatMap((a) => {
    const t = transMap.get(a.id) || transEnMap.get(a.id);
    return t ? [toListItem(a, t)] : [];
  });
}

/**
 * Combined data for the public /[locale]/insight index: the article list AND
 * the category tabs. Two query waves on the shared pool; never selects body.
 */
export async function getInsightIndexData(
  locale: string,
): Promise<{ list: ArticleListItem[]; categories: ArticleCategory[] }> {
  const snapshot = getSnapshot();
  if (snapshot) {
    const base = snapshot.data.articles
      .filter((a) => a.isActive)
      .sort(byArticleDateDesc);
    const allTrans = snapshotListTranslations(snapshot, base.map((a) => a.id), locale);
    return {
      list: resolveList(base, allTrans, locale),
      categories: getSnapshotCategories(snapshot, locale),
    };
  }

  const db = getDb();
  const localesWanted = locale === 'en' ? ['en'] : [locale, 'en'];

  // Sequential, product-like: one pooled connection at a time (the product
  // pages fetch the same way). A parallel fan-out demanded more cold
  // connections than the max-3 build pool could set up inside the 60s budget.
  const base = await db
    .select()
    .from(articles)
    .where(eq(articles.isActive, true))
    .orderBy(desc(articles.publishedAt), desc(articles.id));
  const cats = await db
    .select()
    .from(articleCategories)
    .orderBy(articleCategories.displayOrder, articleCategories.id);

  const allTrans = base.length
    ? await db
        .select(listTransColumns)
        .from(articleTranslations)
        .where(
          and(
            inArray(articleTranslations.articleId, base.map((a) => a.id)),
            inArray(articleTranslations.locale, localesWanted),
          ),
        )
    : ([] as ListTrans[]);
  const catTrans = cats.length
    ? await db
        .select()
        .from(articleCategoryTranslations)
        .where(inArray(articleCategoryTranslations.categoryId, cats.map((c) => c.id)))
    : ([] as (typeof articleCategoryTranslations.$inferSelect)[]);

  const byCat = new Map<number, Map<string, string>>();
  for (const ct of catTrans) {
    const m = byCat.get(ct.categoryId) ?? new Map<string, string>();
    m.set(ct.locale, ct.name);
    byCat.set(ct.categoryId, m);
  }
  const categories: ArticleCategory[] = cats.map((c) => {
    const names = byCat.get(c.id);
    return {
      key: c.key,
      name: names?.get(locale) || names?.get('en') || categoryFallbackLabel(c.key),
    };
  });

  return { list: resolveList(base, allTrans, locale), categories };
}

/**
 * Article + LIGHT translation for `(locale, slug)` (no body — used by
 * generateMetadata AND the detail page; the detail page loads body separately
 * via getArticleBody). Returns null when the locale has no translation here.
 */
export async function getArticleRouteData(locale: string, slug: string) {
  const snapshot = getSnapshot();
  if (snapshot) {
    const trans = snapshot.data.articleTranslations.find((t) => t.locale === locale && t.slug === slug);
    const article = trans
      ? snapshot.data.articles.find((a) => a.id === trans.articleId && a.isActive)
      : undefined;
    return article && trans
      ? {
          article,
          trans: {
            id: trans.id,
            articleId: trans.articleId,
            locale: trans.locale,
            slug: trans.slug,
            title: trans.title,
            dek: trans.dek,
            author: trans.author,
          },
        }
      : null;
  }

  const db = getDb();
  const joined = await db
    .select({
      article: articles,
      trans: { id: articleTranslations.id, ...listTransColumns },
    })
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
  return joined[0] ?? null;
}

/**
 * Heavy article HTML for one translation — ONLY the detail page calls this.
 * Reads from article_translation_bodies (keyed by article_translations.id).
 */
export async function getArticleBody(articleTranslationId: number): Promise<string | null> {
  const snapshot = getSnapshot();
  if (snapshot) {
    return snapshot.data.articleTranslationBodies.find((b) => b.articleTranslationId === articleTranslationId)?.body ?? null;
  }

  const db = getDb();
  const rows = await db
    .select({ body: articleTranslationBodies.body })
    .from(articleTranslationBodies)
    .where(eq(articleTranslationBodies.articleTranslationId, articleTranslationId))
    .limit(1);
  return rows[0]?.body ?? null;
}

/** All `(locale, slug)` pairs for an article — used to build hreflang. Light. */
export async function getArticleAllTranslations(articleId: number) {
  const snapshot = getSnapshot();
  if (snapshot) {
    return snapshot.data.articleTranslations
      .filter((t) => t.articleId === articleId)
      .map((t) => ({ locale: t.locale, slug: t.slug }));
  }

  const db = getDb();
  return db
    .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, articleId));
}

export async function getArticleStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const snapshot = getSnapshot();
  if (snapshot) {
    const activeArticleIds = new Set(snapshot.data.articles.filter((a) => a.isActive).map((a) => a.id));
    return snapshot.data.articleTranslations
      .filter((r) => activeArticleIds.has(r.articleId))
      .map((r) => ({ locale: r.locale, slug: r.slug }));
  }

  const db = getDb();
  const rows = await db
    .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(eq(articles.isActive, true));
  return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
}

export async function getArticleMissingLocaleRedirect(
  locale: string,
  slug: string,
): Promise<string | null> {
  const snapshot = getSnapshot();
  if (snapshot) {
    const anyTrans = snapshot.data.articleTranslations.find((t) => t.slug === slug);
    const article = anyTrans
      ? snapshot.data.articles.find((a) => a.id === anyTrans.articleId && a.isActive)
      : undefined;
    if (!article || !anyTrans) return null;

    const localizedSlugRow = snapshot.data.articleTranslations.find(
      (t) => t.articleId === article.id && t.locale === locale,
    );
    if (localizedSlugRow?.slug && localizedSlugRow.slug !== slug) {
      return localizedPath(locale, `/insight/${localizedSlugRow.slug}`);
    }
    return localizedPath(anyTrans.locale, `/insight/${anyTrans.slug}`);
  }

  const db = getDb();
  const any = await db
    .select({ article: articles, trans: articleTranslations })
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(and(eq(articleTranslations.slug, slug), eq(articles.isActive, true)))
    .limit(1);
  const target = any[0];
  if (!target) return null;

  const localizedSlugRow = await db
    .select({ slug: articleTranslations.slug })
    .from(articleTranslations)
    .where(and(eq(articleTranslations.articleId, target.article.id), eq(articleTranslations.locale, locale)))
    .limit(1);

  if (localizedSlugRow[0]?.slug && localizedSlugRow[0].slug !== slug) {
    return localizedPath(locale, `/insight/${localizedSlugRow[0].slug}`);
  }

  return localizedPath(target.trans.locale, `/insight/${target.trans.slug}`);
}

/**
 * "More from Insight": the newest `limit` active articles excluding the one
 * being read. Light translations only (no body). Over-fetches ×3 so the
 * locale/EN fallback can drop rows without leaving the list short.
 */
export async function getMoreStories(
  locale: string,
  excludeArticleId: number,
  limit: number,
): Promise<ArticleListItem[]> {
  const snapshot = getSnapshot();
  if (snapshot) {
    const base = snapshot.data.articles
      .filter((a) => a.isActive && a.id !== excludeArticleId)
      .sort(byArticleDateDesc)
      .slice(0, limit * 3);
    if (base.length === 0) return [];
    const allTrans = snapshotListTranslations(snapshot, base.map((a) => a.id), locale);
    return resolveList(base, allTrans, locale).slice(0, limit);
  }

  const db = getDb();
  const base = await db
    .select()
    .from(articles)
    .where(and(eq(articles.isActive, true), ne(articles.id, excludeArticleId)))
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(limit * 3);
  if (base.length === 0) return [];

  const allTrans = await db
    .select(listTransColumns)
    .from(articleTranslations)
    .where(
      and(
        inArray(articleTranslations.articleId, base.map((a) => a.id)),
        inArray(articleTranslations.locale, locale === 'en' ? ['en'] : [locale, 'en']),
      ),
    );

  return resolveList(base, allTrans, locale).slice(0, limit);
}

export interface ArticleRelatedProduct {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  modelNumber: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
}

/**
 * Catalog products an article features, in editor order — shaped for
 * `ProductCard`. Locale translation + English fallback + primary image,
 * restricted to active products. Reads (never writes) the product tables.
 */
export async function getArticleProducts(
  articleId: number,
  locale: string,
): Promise<ArticleRelatedProduct[]> {
  const snapshot = getSnapshot();
  if (snapshot) {
    const rows = snapshot.data.articleProducts
      .filter((link) => link.articleId === articleId)
      .sort(byDisplayOrder)
      .flatMap((link) => {
        const product = snapshot.data.products.find((p) => p.id === link.productId && p.isActive);
        return product ? [{ link, product }] : [];
      });
    const pids = rows.map((r) => r.product.id);
    if (pids.length === 0) return [];

    const wanted = new Set(locale === defaultLocale ? [defaultLocale] : [locale, defaultLocale]);
    const allTrans = snapshot.data.productTranslations.filter((t) => pids.includes(t.productId) && wanted.has(t.locale));
    const imgs = snapshot.data.productImages.filter((img) => pids.includes(img.productId));

    const transMap = new Map(allTrans.filter((t) => t.locale === locale).map((t) => [t.productId, t]));
    const transEnMap = new Map(allTrans.filter((t) => t.locale === defaultLocale).map((t) => [t.productId, t]));
    const imgMap = new Map<number, (typeof imgs)[number]>();
    for (const img of imgs) {
      const existing = imgMap.get(img.productId);
      if (!existing || (img.isPrimary && !existing.isPrimary)) imgMap.set(img.productId, img);
    }

    return rows.map(({ product: p }): ArticleRelatedProduct => {
      const t = transMap.get(p.id) || transEnMap.get(p.id);
      return {
        id: p.id,
        name: t?.name || 'Product',
        slug: t?.slug || `product-${p.id}`,
        shortDescription: t?.shortDescription ?? null,
        modelNumber: p.modelNumber,
        imageUrl: imgMap.get(p.id)?.imageUrl ?? null,
        isFeatured: p.isFeatured,
      };
    });
  }

  const db = getDb();
  const rows = await db
    .select({ link: articleProducts, product: products })
    .from(articleProducts)
    .innerJoin(
      products,
      and(eq(products.id, articleProducts.productId), eq(products.isActive, true)),
    )
    .where(eq(articleProducts.articleId, articleId))
    .orderBy(articleProducts.displayOrder);
  const pids = rows.map((r) => r.product.id);
  if (pids.length === 0) return [];

  // Sequential, product-like (see getInsightIndexData).
  const allTrans = await db
    .select()
    .from(productTranslations)
    .where(
      and(
        inArray(productTranslations.productId, pids),
        inArray(productTranslations.locale, locale === 'en' ? ['en'] : [locale, 'en']),
      ),
    );
  const imgs = await db.select().from(productImages).where(inArray(productImages.productId, pids));

  const transMap = new Map(allTrans.filter((t) => t.locale === locale).map((t) => [t.productId, t]));
  const transEnMap = new Map(allTrans.filter((t) => t.locale === 'en').map((t) => [t.productId, t]));
  const imgMap = new Map<number, (typeof imgs)[number]>();
  for (const img of imgs) {
    const existing = imgMap.get(img.productId);
    if (!existing || (img.isPrimary && !existing.isPrimary)) imgMap.set(img.productId, img);
  }

  return rows.map(({ product: p }): ArticleRelatedProduct => {
    const t = transMap.get(p.id) || transEnMap.get(p.id);
    return {
      id: p.id,
      name: t?.name || 'Product',
      slug: t?.slug || `product-${p.id}`,
      shortDescription: t?.shortDescription ?? null,
      modelNumber: p.modelNumber,
      imageUrl: imgMap.get(p.id)?.imageUrl ?? null,
      isFeatured: p.isFeatured,
    };
  });
}

/** Locale-aware "12 May 2026" style label for an article's publish date. */
export function formatArticleDate(publishedAt: string, locale: string): string {
  const d = new Date(publishedAt);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  }
}

/** Plain-text excerpt from stored HTML, for meta descriptions and JSON-LD. */
export function articleExcerpt(html: string | null | undefined, max = 300): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
