import 'server-only';
import { getDb } from '@/lib/db';
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
import { getBuildSnapshot, type BuildSnapshot } from '@/lib/build-cache';

// Insight reads mirror the product pages: direct, batched Drizzle queries on
// the shared pool, cached only by page-level ISR. Critically, the list /
// index / metadata / more-stories paths NEVER select `body` — the heavy
// article HTML lives in article_translation_bodies and is loaded only by the
// detail page (getArticleBody). That keeps article_translations as light as
// product_translations so static generation of all 7 locales stays cheap.
//
// Each public loader has two code paths:
//   1. snapshot path (BUILD_CACHE=1 + phase-production-build): pure in-memory
//      lookups against the build-time bulk snapshot — zero DB round-trips.
//   2. Drizzle path: today's queries, untouched. Runtime ISR always lands
//      here so `revalidate` cadence is preserved.
// The two paths must produce byte-identical output; the SQL ORDER BY /
// WHERE clauses are mirrored as JS sort/filter against the snapshot indices.

export interface ArticleCategory {
  key: string;
  name: string;
}

/** Title-cased key, the last-resort label when no translation row exists. */
export function categoryFallbackLabel(key: string): string {
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : key;
}

function snapCategories(snap: BuildSnapshot, locale: string): ArticleCategory[] {
  // Mirrors SQL: ORDER BY displayOrder, id; English fallback for name.
  const cats = [...snap.articleCategories].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id - b.id,
  );
  return cats.map((c) => {
    const tr =
      snap.indices.articleCategoryTransByCatLocale.get(`${c.id}|${locale}`) ??
      snap.indices.articleCategoryTransByCatLocale.get(`${c.id}|en`);
    return { key: c.key, name: tr?.name || categoryFallbackLabel(c.key) };
  });
}

/**
 * CMS-managed categories for a locale, in editor order, with the usual English
 * fallback per name (then the title-cased key). Returns [] only for the
 * legitimate empty case (no rows); a DB failure throws so the caller fails
 * loudly instead of silently dropping the tabs.
 */
export async function getArticleCategories(locale: string): Promise<ArticleCategory[]> {
  const snap = await getBuildSnapshot();
  if (snap) return snapCategories(snap, locale);

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
  const snap = await getBuildSnapshot();
  if (snap) {
    // Mirror SQL: WHERE isActive = true; ORDER BY publishedAt DESC, id DESC.
    const base = snap.articles
      .filter((a) => a.isActive)
      .sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) || b.id - a.id,
      );
    const wantedLocales = locale === 'en' ? ['en'] : [locale, 'en'];
    const baseIds = new Set(base.map((a) => a.id));
    const allTrans: ListTrans[] = snap.articleTranslations.filter(
      (t) => baseIds.has(t.articleId) && wantedLocales.includes(t.locale),
    );
    return { list: resolveList(base, allTrans, locale), categories: snapCategories(snap, locale) };
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
  const snap = await getBuildSnapshot();
  if (snap) {
    const trans = snap.indices.articleTransByLocaleSlug.get(`${locale}|${slug}`);
    if (!trans) return null;
    const article = snap.indices.articleById.get(trans.articleId);
    // Mirror SQL: WHERE articles.isActive = true.
    if (!article || !article.isActive) return null;
    return {
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
    };
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
 *
 * Deliberately NOT included in the build snapshot: bodies are 5–20 KB each
 * and scale linearly with content; one row table-scan per detail page is
 * cheap on a per-worker pool that is already warm by then.
 */
export async function getArticleBody(articleTranslationId: number): Promise<string | null> {
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
  const snap = await getBuildSnapshot();
  if (snap) {
    return snap.articleTranslations
      .filter((t) => t.articleId === articleId)
      .map((t) => ({ locale: t.locale, slug: t.slug }));
  }

  const db = getDb();
  return db
    .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, articleId));
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
  const snap = await getBuildSnapshot();
  if (snap) {
    const wantedLocales = locale === 'en' ? ['en'] : [locale, 'en'];
    // Mirror SQL: WHERE isActive = true AND id != excludeArticleId;
    // ORDER BY publishedAt DESC, id DESC; LIMIT limit*3.
    const base = snap.articles
      .filter((a) => a.isActive && a.id !== excludeArticleId)
      .sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) || b.id - a.id,
      )
      .slice(0, limit * 3);
    if (base.length === 0) return [];
    const baseIds = new Set(base.map((a) => a.id));
    const allTrans: ListTrans[] = snap.articleTranslations.filter(
      (t) => baseIds.has(t.articleId) && wantedLocales.includes(t.locale),
    );
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
  const snap = await getBuildSnapshot();
  if (snap) {
    const links = snap.indices.articleProductsByArticle.get(articleId) ?? [];
    // links is already sorted by displayOrder. Mirror SQL: INNER JOIN products
    // ON products.isActive = true (drop links whose product is inactive or gone).
    const rows = links.flatMap((link) => {
      const product = snap.indices.productById.get(link.productId);
      if (!product || !product.isActive) return [];
      return [{ link, product }];
    });
    if (rows.length === 0) return [];

    return rows.map(({ product: p }): ArticleRelatedProduct => {
      const tr =
        snap.indices.productTransByProductLocale.get(`${p.id}|${locale}`) ??
        snap.indices.productTransByProductLocale.get(`${p.id}|en`);
      const imgs = snap.indices.productImagesByProduct.get(p.id) ?? [];
      // Match the existing "isPrimary wins, else first by displayOrder" rule.
      let chosen: (typeof imgs)[number] | undefined = undefined;
      for (const img of imgs) {
        if (!chosen || (img.isPrimary && !chosen.isPrimary)) chosen = img;
      }
      return {
        id: p.id,
        name: tr?.name || 'Product',
        slug: tr?.slug || `product-${p.id}`,
        shortDescription: tr?.shortDescription ?? null,
        modelNumber: p.modelNumber,
        imageUrl: chosen?.imageUrl ?? null,
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
