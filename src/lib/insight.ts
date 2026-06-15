import 'server-only';
import { getDb } from '@/lib/db';
import {
  articles,
  articleTranslations,
  articleProducts,
  articleCategories,
  articleCategoryTranslations,
  products,
  productTranslations,
  productImages,
} from '@/lib/db/schema';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';

// Insight reads mirror the product pages: direct, batched Drizzle queries on
// the shared pooled connection, cached ONLY by page-level ISR (`export const
// revalidate` on each route). There is intentionally no second `unstable_cache`
// data layer — stacking the Data Cache + tag-busting on top of ISR was what
// produced the cold-connection storms that timed out both the build (iad1 →
// eu-west-1 cold setup × N isolated keys > 60s/page) and runtime (a deploy or
// a `revalidateTag` forced a synchronous cold refetch of every isolated key).
// CMS writes invalidate with `revalidatePath`, exactly like the product routes.

// TEMP diagnostic — remove once the insight prerender hang is root-caused.
// Logs each read's wall time so the Vercel build logs pinpoint which query
// stalls (and whether it's query execution or connection acquisition).
async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    return await fn();
  } finally {
    console.log(`[itiming] ${label}: ${Date.now() - t0}ms`);
  }
}

export interface ArticleCategory {
  key: string;
  name: string;
}

/** Title-cased key, the last-resort label when no translation row exists. */
export function categoryFallbackLabel(key: string): string {
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : key;
}

/**
 * CMS-managed categories for a locale, in editor order, with the usual English
 * fallback per name (then the title-cased key). Returns [] only for the
 * legitimate empty case (no rows); a DB failure throws so the caller fails
 * loudly instead of silently dropping the tabs.
 */
export async function getArticleCategories(locale: string): Promise<ArticleCategory[]> {
  const db = getDb();
  const cats = await timed('cat.list', () =>
    db
      .select()
      .from(articleCategories)
      .orderBy(articleCategories.displayOrder, articleCategories.id),
  );
  if (cats.length === 0) return [];

  const trans = await timed('cat.trans', () =>
    db
      .select()
      .from(articleCategoryTranslations)
      .where(inArray(articleCategoryTranslations.categoryId, cats.map((c) => c.id))),
  );

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
  // The list page links English-fallback cards to /en/ rather than creating
  // phantom /pt/, /fr/, … detail URLs.
  translationLocale: string;
}

// Shared shaping for a list row from an article + its chosen translation.
function toListItem(
  a: typeof articles.$inferSelect,
  t: typeof articleTranslations.$inferSelect,
): ArticleListItem {
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
  allTrans: (typeof articleTranslations.$inferSelect)[],
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
 * the category tabs. Two query waves on the shared pool (the products-list
 * recipe): first the two base tables in parallel, then their translations in
 * parallel. A DB failure throws; ISR keeps serving the last good render.
 */
export async function getInsightIndexData(
  locale: string,
): Promise<{ list: ArticleListItem[]; categories: ArticleCategory[] }> {
  const db = getDb();
  const localesWanted = locale === 'en' ? ['en'] : [locale, 'en'];

  const tAll = Date.now();
  // Wave 1 — base rows for both sections in parallel.
  const [base, cats] = await Promise.all([
    timed('idx.articles', () =>
      db
        .select()
        .from(articles)
        .where(eq(articles.isActive, true))
        .orderBy(desc(articles.publishedAt), desc(articles.id)),
    ),
    timed('idx.categories', () =>
      db
        .select()
        .from(articleCategories)
        .orderBy(articleCategories.displayOrder, articleCategories.id),
    ),
  ]);

  // Wave 2 — translations for whatever the base rows produced, in parallel.
  const [allTrans, catTrans] = await Promise.all([
    base.length
      ? timed('idx.articleTrans', () =>
          db
            .select()
            .from(articleTranslations)
            .where(
              and(
                inArray(articleTranslations.articleId, base.map((a) => a.id)),
                inArray(articleTranslations.locale, localesWanted),
              ),
            ),
        )
      : Promise.resolve([] as (typeof articleTranslations.$inferSelect)[]),
    cats.length
      ? timed('idx.catTrans', () =>
          db
            .select()
            .from(articleCategoryTranslations)
            .where(inArray(articleCategoryTranslations.categoryId, cats.map((c) => c.id))),
        )
      : Promise.resolve([] as (typeof articleCategoryTranslations.$inferSelect)[]),
  ]);
  console.log(`[itiming] idx.TOTAL(${locale}): ${Date.now() - tAll}ms`);

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
 * Article + translation lookup for `(locale, slug)`. Returns null when the
 * locale doesn't have its own translation with this slug.
 */
export async function getArticleRouteData(locale: string, slug: string) {
  const db = getDb();
  const joined = await timed('route', () =>
    db
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
      .limit(1),
  );
  return joined[0] ?? null;
}

/** All `(locale, slug)` pairs for an article — used to build hreflang. */
export async function getArticleAllTranslations(articleId: number) {
  const db = getDb();
  return db
    .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, articleId));
}

/**
 * "More from Insight": the newest `limit` active articles excluding the one
 * being read. Over-fetches ×3 so the locale/EN fallback can drop rows without
 * leaving the list short, then slices to `limit`.
 */
export async function getMoreStories(
  locale: string,
  excludeArticleId: number,
  limit: number,
): Promise<ArticleListItem[]> {
  const db = getDb();
  const base = await timed('more.base', () =>
    db
      .select()
      .from(articles)
      .where(and(eq(articles.isActive, true), ne(articles.id, excludeArticleId)))
      .orderBy(desc(articles.publishedAt), desc(articles.id))
      .limit(limit * 3),
  );
  if (base.length === 0) return [];

  const allTrans = await timed('more.trans', () =>
    db
      .select()
      .from(articleTranslations)
      .where(
        and(
          inArray(articleTranslations.articleId, base.map((a) => a.id)),
          inArray(articleTranslations.locale, locale === 'en' ? ['en'] : [locale, 'en']),
        ),
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
  const db = getDb();
  const rows = await timed('prod.links', () =>
    db
      .select({ link: articleProducts, product: products })
      .from(articleProducts)
      .innerJoin(
        products,
        and(eq(products.id, articleProducts.productId), eq(products.isActive, true)),
      )
      .where(eq(articleProducts.articleId, articleId))
      .orderBy(articleProducts.displayOrder),
  );
  const pids = rows.map((r) => r.product.id);
  if (pids.length === 0) return [];

  const [allTrans, imgs] = await Promise.all([
    timed('prod.trans', () =>
      db
        .select()
        .from(productTranslations)
        .where(
          and(
            inArray(productTranslations.productId, pids),
            inArray(productTranslations.locale, locale === 'en' ? ['en'] : [locale, 'en']),
          ),
        ),
    ),
    timed('prod.imgs', () =>
      db.select().from(productImages).where(inArray(productImages.productId, pids)),
    ),
  ]);

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
