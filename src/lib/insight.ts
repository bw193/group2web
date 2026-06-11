import 'server-only';
import { getDb, withDbRetry } from '@/lib/db';
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
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

export interface ArticleCategory {
  key: string;
  name: string;
}

/** Title-cased key, the last-resort label when no translation row exists. */
export function categoryFallbackLabel(key: string): string {
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : key;
}

// Until drizzle/0005 has been applied, selecting from article_categories
// raises `42P01 undefined_table`. An ERROR through the transaction pooler is
// worse than wasted latency: it can leave the pooled server connection in a
// bad state that an unrelated page then inherits (observed as random pages
// hanging during builds). So never send the doomed query — probe pg_tables
// (a valid query) once per process and skip categories while absent.
let categoriesTablePresent: boolean | undefined;

async function categoriesTableExists(db: ReturnType<typeof getDb>): Promise<boolean> {
  if (categoriesTablePresent !== undefined) return categoriesTablePresent;
  const rows = await db.execute(
    sql`select 1 from pg_catalog.pg_tables where schemaname = current_schema() and tablename = 'article_categories' limit 1`,
  );
  categoriesTablePresent = rows.length > 0;
  if (!categoriesTablePresent) {
    console.error('article_categories table missing (run drizzle/0005); categories disabled for this process');
  }
  return categoriesTablePresent;
}

/**
 * CMS-managed categories for a locale, in editor order, with the usual
 * English fallback per name (then the title-cased key). Returns [] only for
 * the legitimate empty cases (tables not yet migrated, no rows); a DB failure
 * throws so the caller fails loudly instead of silently dropping the tabs.
 */
export async function getArticleCategories(locale: string): Promise<ArticleCategory[]> {
  return withDbRetry(async () => {
    const db = getDb();
    if (!(await categoriesTableExists(db))) return [];
    const cats = await db
      .select()
      .from(articleCategories)
      .orderBy(articleCategories.displayOrder, articleCategories.id);
    if (cats.length === 0) return [];

    const ids = cats.map((c) => c.id);
    const trans = await db
      .select()
      .from(articleCategoryTranslations)
      .where(inArray(articleCategoryTranslations.categoryId, ids));

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
}

/**
 * Active articles for a locale, newest first. Batch-loads the locale's
 * translations plus an English fallback in parallel (the products-list
 * recipe); articles with no translation in either are dropped. A DB failure
 * throws — pages fail loudly and ISR keeps serving the last good render.
 */
export async function getArticleList(locale: string): Promise<ArticleListItem[]> {
  return withDbRetry(async () => {
    const db = getDb();
      const base = await db
        .select()
        .from(articles)
        .where(eq(articles.isActive, true))
        .orderBy(desc(articles.publishedAt), desc(articles.id));
      if (base.length === 0) return [];

      const ids = base.map((a) => a.id);
      const [trans, transEn] = await Promise.all([
        db
          .select()
          .from(articleTranslations)
          .where(and(inArray(articleTranslations.articleId, ids), eq(articleTranslations.locale, locale))),
        locale !== 'en'
          ? db
              .select()
              .from(articleTranslations)
              .where(and(inArray(articleTranslations.articleId, ids), eq(articleTranslations.locale, 'en')))
          : Promise.resolve([] as (typeof articleTranslations.$inferSelect)[]),
      ]);

      const transMap = new Map(trans.map((t) => [t.articleId, t]));
      const transEnMap = new Map(transEn.map((t) => [t.articleId, t]));

      return base.flatMap((a): ArticleListItem[] => {
        const t = transMap.get(a.id) || transEnMap.get(a.id);
        if (!t) return [];
        return [
          {
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
          },
        ];
      });
  });
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
 * restricted to active products.
 */
export async function getArticleProducts(
  articleId: number,
  locale: string,
): Promise<ArticleRelatedProduct[]> {
  return withDbRetry(async () => {
      const db = getDb();
      const links = await db
        .select()
        .from(articleProducts)
        .where(eq(articleProducts.articleId, articleId))
        .orderBy(articleProducts.displayOrder);
      const pids = links.map((l) => l.productId);
      if (pids.length === 0) return [];

      const [prods, trans, transEn, imgs] = await Promise.all([
        db.select().from(products).where(and(inArray(products.id, pids), eq(products.isActive, true))),
        db
          .select()
          .from(productTranslations)
          .where(and(inArray(productTranslations.productId, pids), eq(productTranslations.locale, locale))),
        locale !== 'en'
          ? db
              .select()
              .from(productTranslations)
              .where(and(inArray(productTranslations.productId, pids), eq(productTranslations.locale, 'en')))
          : Promise.resolve([] as (typeof productTranslations.$inferSelect)[]),
        db.select().from(productImages).where(inArray(productImages.productId, pids)),
      ]);

      const prodMap = new Map(prods.map((p) => [p.id, p]));
      const transMap = new Map(trans.map((t) => [t.productId, t]));
      const transEnMap = new Map(transEn.map((t) => [t.productId, t]));
      const imgMap = new Map<number, (typeof imgs)[number]>();
      for (const img of imgs) {
        const existing = imgMap.get(img.productId);
        if (!existing || (img.isPrimary && !existing.isPrimary)) imgMap.set(img.productId, img);
      }

      return links.flatMap((l): ArticleRelatedProduct[] => {
        const p = prodMap.get(l.productId);
        if (!p) return [];
        const t = transMap.get(p.id) || transEnMap.get(p.id);
        return [
          {
            id: p.id,
            name: t?.name || 'Product',
            slug: t?.slug || `product-${p.id}`,
            shortDescription: t?.shortDescription ?? null,
            modelNumber: p.modelNumber,
            imageUrl: imgMap.get(p.id)?.imageUrl ?? null,
            isFeatured: p.isFeatured,
          },
        ];
      });
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
