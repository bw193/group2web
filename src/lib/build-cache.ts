import 'server-only';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from './db';
import * as S from './db/schema';

// Build-time snapshot of every table the public site reads during SSG.
//
// The static-generation phase used to issue 7–17 serialized Drizzle queries
// per prerendered route (~525 routes × 7 locales) against an eu-west-1
// Supavisor pooler, queueing on cold connection setup. Throttling
// (cpus:1 + maxConcurrency:2 + max-3 pool) kept builds green at the cost of
// 7+ minute wall-time. Bulk-loading every relevant table once per worker and
// answering loaders from in-memory indices removes the per-page DB fan-out
// entirely — see C:\Users\Hello\.claude\plans\propose-a-fix-for-jaunty-pnueli.md.
//
// Invariants the rest of the codebase relies on:
//   - Only warms when BUILD_CACHE=1 AND NEXT_PHASE === phase-production-build.
//     Runtime ISR lambdas always fall through to live Drizzle so the per-page
//     `revalidate` cadence is preserved.
//   - Singleton per Node worker. Next 15 SSG runs in forked processes
//     (enableWorkerThreads is false by default), so this module is loaded
//     once per worker; the Promise dedupes concurrent callers WITHIN a worker.
//     Expect ~4 warms per build (default cpus = 4).
//   - Rows are stored unfiltered. Loaders MUST reapply WHERE clauses
//     (isActive, isFeatured, etc.) in JS to match SQL semantics exactly.
//   - article_translation_bodies is deliberately EXCLUDED — only the insight
//     detail page reads it, and the body table is the only one with
//     unbounded growth. getArticleBody stays a one-shot Drizzle query.
//   - No try/catch around the bulk fetch. An unreachable DB at build start
//     must crash the build, not silently ship an empty site
//     (see [[no-fallback-masking]]).

type Banner = InferSelectModel<typeof S.banners>;
type BannerTranslation = InferSelectModel<typeof S.bannerTranslations>;
type Product = InferSelectModel<typeof S.products>;
type ProductTranslation = InferSelectModel<typeof S.productTranslations>;
type ProductImage = InferSelectModel<typeof S.productImages>;
type ProductSpecification = InferSelectModel<typeof S.productSpecifications>;
type ProductCategory = InferSelectModel<typeof S.productCategories>;
type CategoryTranslation = InferSelectModel<typeof S.categoryTranslations>;
type Article = InferSelectModel<typeof S.articles>;
// Light projection — the heavy `body` column lives in articleTranslationBodies
// and is NOT included in the snapshot. Matches the legacy column set that
// every list/index/metadata path already selected.
type ArticleTranslationLight = {
  id: number;
  articleId: number;
  locale: string;
  slug: string;
  title: string;
  dek: string | null;
  author: string | null;
};
type ArticleProduct = InferSelectModel<typeof S.articleProducts>;
type ArticleCategory = InferSelectModel<typeof S.articleCategories>;
type ArticleCategoryTranslation = InferSelectModel<typeof S.articleCategoryTranslations>;
type AboutPage = InferSelectModel<typeof S.aboutPage>;
type AboutGallery = InferSelectModel<typeof S.aboutGallery>;
type Faq = InferSelectModel<typeof S.faqs>;
type FaqTranslation = InferSelectModel<typeof S.faqTranslations>;

export interface BuildSnapshot {
  banners: Banner[];
  bannerTranslations: BannerTranslation[];
  products: Product[];
  productTranslations: ProductTranslation[];
  productImages: ProductImage[];
  productSpecifications: ProductSpecification[];
  productCategories: ProductCategory[];
  categoryTranslations: CategoryTranslation[];
  articles: Article[];
  articleTranslations: ArticleTranslationLight[];
  articleProducts: ArticleProduct[];
  articleCategories: ArticleCategory[];
  articleCategoryTranslations: ArticleCategoryTranslation[];
  aboutPage: AboutPage[];
  aboutGallery: AboutGallery[];
  faqs: Faq[];
  faqTranslations: FaqTranslation[];

  indices: {
    productById: Map<number, Product>;
    /** `${locale}|${slug}` → translation row for the routing lookup. */
    productTransByLocaleSlug: Map<string, ProductTranslation>;
    /** `${productId}|${locale}` → translation row for per-product locale lookups. */
    productTransByProductLocale: Map<string, ProductTranslation>;
    /** slug → ALL translation rows with that slug across every locale. Used for
     *  the "find this slug in any locale" fallback before a permanent redirect. */
    productTransBySlug: Map<string, ProductTranslation[]>;
    /** productId → images sorted by displayOrder, matching SQL ORDER BY. */
    productImagesByProduct: Map<number, ProductImage[]>;
    /** `${productId}|${locale}` → specs for that pair. Specs are NOT
     *  English-fallback rendered today; loaders must match that exactly. */
    productSpecsByProductLocale: Map<string, ProductSpecification[]>;
    /** `${categoryId}|${locale}` → translation row. */
    categoryTransByCategoryLocale: Map<string, CategoryTranslation>;
    /** `${bannerId}|${locale}` → translation row. */
    bannerTransByBannerLocale: Map<string, BannerTranslation>;
    articleById: Map<number, Article>;
    /** `${locale}|${slug}` → light translation row. */
    articleTransByLocaleSlug: Map<string, ArticleTranslationLight>;
    /** `${articleId}|${locale}` → light translation row. */
    articleTransByArticleLocale: Map<string, ArticleTranslationLight>;
    /** slug → ALL article translation rows with that slug (any-locale fallback). */
    articleTransBySlug: Map<string, ArticleTranslationLight[]>;
    /** articleId → article_products rows sorted by displayOrder. */
    articleProductsByArticle: Map<number, ArticleProduct[]>;
    /** `${categoryId}|${locale}` → category translation row. */
    articleCategoryTransByCatLocale: Map<string, ArticleCategoryTranslation>;
    /** `${faqId}|${locale}` → translation row. */
    faqTransByFaqLocale: Map<string, FaqTranslation>;
    /** locale → about row (with no English fallback baked in; loaders fall back themselves). */
    aboutByLocale: Map<string, AboutPage>;
    /** imageType → gallery rows sorted by displayOrder. */
    aboutGalleryByType: Map<string, AboutGallery[]>;
  };
}

export function shouldUseSnapshot(): boolean {
  return (
    process.env.BUILD_CACHE === '1' &&
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
  );
}

let snapshotPromise: Promise<BuildSnapshot> | null = null;

export async function getBuildSnapshot(): Promise<BuildSnapshot | null> {
  if (!shouldUseSnapshot()) return null;
  snapshotPromise ??= warmSnapshot();
  return snapshotPromise;
}

async function warmSnapshot(): Promise<BuildSnapshot> {
  const db = getDb();
  const startedAt = Date.now();

  // One round-trip per table, all in flight together. Bare SELECT — no WHERE,
  // no projection. The only narrowing is article_translations, which excludes
  // the heavy `body` column (body lives in articleTranslationBodies and is
  // loaded on-demand by the detail page only).
  const [
    banners,
    bannerTranslations,
    products,
    productTranslations,
    productImages,
    productSpecifications,
    productCategories,
    categoryTranslations,
    articles,
    articleTranslations,
    articleProducts,
    articleCategories,
    articleCategoryTranslations,
    aboutPage,
    aboutGallery,
    faqs,
    faqTranslations,
  ] = await Promise.all([
    db.select().from(S.banners),
    db.select().from(S.bannerTranslations),
    db.select().from(S.products),
    db.select().from(S.productTranslations),
    db.select().from(S.productImages),
    db.select().from(S.productSpecifications),
    db.select().from(S.productCategories),
    db.select().from(S.categoryTranslations),
    db.select().from(S.articles),
    db
      .select({
        id: S.articleTranslations.id,
        articleId: S.articleTranslations.articleId,
        locale: S.articleTranslations.locale,
        slug: S.articleTranslations.slug,
        title: S.articleTranslations.title,
        dek: S.articleTranslations.dek,
        author: S.articleTranslations.author,
      })
      .from(S.articleTranslations),
    db.select().from(S.articleProducts),
    db.select().from(S.articleCategories),
    db.select().from(S.articleCategoryTranslations),
    db.select().from(S.aboutPage),
    db.select().from(S.aboutGallery),
    db.select().from(S.faqs),
    db.select().from(S.faqTranslations),
  ]);

  // Indices. Map keys are explicit strings so call sites and the contract
  // documented above cannot drift apart.
  const productById = new Map<number, Product>();
  for (const p of products) productById.set(p.id, p);

  const productTransByLocaleSlug = new Map<string, ProductTranslation>();
  const productTransByProductLocale = new Map<string, ProductTranslation>();
  const productTransBySlug = new Map<string, ProductTranslation[]>();
  for (const t of productTranslations) {
    productTransByLocaleSlug.set(`${t.locale}|${t.slug}`, t);
    productTransByProductLocale.set(`${t.productId}|${t.locale}`, t);
    const bucket = productTransBySlug.get(t.slug);
    if (bucket) bucket.push(t);
    else productTransBySlug.set(t.slug, [t]);
  }

  const productImagesByProduct = new Map<number, ProductImage[]>();
  for (const img of productImages) {
    const bucket = productImagesByProduct.get(img.productId);
    if (bucket) bucket.push(img);
    else productImagesByProduct.set(img.productId, [img]);
  }
  // Match SQL ORDER BY productImages.displayOrder.
  for (const arr of productImagesByProduct.values()) {
    arr.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const productSpecsByProductLocale = new Map<string, ProductSpecification[]>();
  for (const spec of productSpecifications) {
    const key = `${spec.productId}|${spec.locale}`;
    const bucket = productSpecsByProductLocale.get(key);
    if (bucket) bucket.push(spec);
    else productSpecsByProductLocale.set(key, [spec]);
  }

  const categoryTransByCategoryLocale = new Map<string, CategoryTranslation>();
  for (const t of categoryTranslations) {
    categoryTransByCategoryLocale.set(`${t.categoryId}|${t.locale}`, t);
  }

  const bannerTransByBannerLocale = new Map<string, BannerTranslation>();
  for (const t of bannerTranslations) {
    bannerTransByBannerLocale.set(`${t.bannerId}|${t.locale}`, t);
  }

  const articleById = new Map<number, Article>();
  for (const a of articles) articleById.set(a.id, a);

  const articleTransByLocaleSlug = new Map<string, ArticleTranslationLight>();
  const articleTransByArticleLocale = new Map<string, ArticleTranslationLight>();
  const articleTransBySlug = new Map<string, ArticleTranslationLight[]>();
  for (const t of articleTranslations) {
    articleTransByLocaleSlug.set(`${t.locale}|${t.slug}`, t);
    articleTransByArticleLocale.set(`${t.articleId}|${t.locale}`, t);
    const bucket = articleTransBySlug.get(t.slug);
    if (bucket) bucket.push(t);
    else articleTransBySlug.set(t.slug, [t]);
  }

  const articleProductsByArticle = new Map<number, ArticleProduct[]>();
  for (const ap of articleProducts) {
    const bucket = articleProductsByArticle.get(ap.articleId);
    if (bucket) bucket.push(ap);
    else articleProductsByArticle.set(ap.articleId, [ap]);
  }
  for (const arr of articleProductsByArticle.values()) {
    arr.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const articleCategoryTransByCatLocale = new Map<string, ArticleCategoryTranslation>();
  for (const t of articleCategoryTranslations) {
    articleCategoryTransByCatLocale.set(`${t.categoryId}|${t.locale}`, t);
  }

  const faqTransByFaqLocale = new Map<string, FaqTranslation>();
  for (const t of faqTranslations) {
    faqTransByFaqLocale.set(`${t.faqId}|${t.locale}`, t);
  }

  const aboutByLocale = new Map<string, AboutPage>();
  for (const a of aboutPage) aboutByLocale.set(a.locale, a);

  const aboutGalleryByType = new Map<string, AboutGallery[]>();
  for (const g of aboutGallery) {
    const bucket = aboutGalleryByType.get(g.imageType);
    if (bucket) bucket.push(g);
    else aboutGalleryByType.set(g.imageType, [g]);
  }
  for (const arr of aboutGalleryByType.values()) {
    arr.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const elapsedMs = Date.now() - startedAt;
  // One audit line per worker per build. Leaves a trail in Vercel logs that
  // confirms the snapshot warmed and tells future-you how big it got.
  console.log(
    `[build-cache] snapshot warmed in ${elapsedMs}ms — ` +
      `products=${products.length} productTranslations=${productTranslations.length} ` +
      `productImages=${productImages.length} productSpecs=${productSpecifications.length} ` +
      `articles=${articles.length} articleTranslations=${articleTranslations.length} ` +
      `articleProducts=${articleProducts.length} ` +
      `categories=${productCategories.length} categoryTranslations=${categoryTranslations.length} ` +
      `banners=${banners.length} bannerTranslations=${bannerTranslations.length} ` +
      `articleCategories=${articleCategories.length} articleCategoryTranslations=${articleCategoryTranslations.length} ` +
      `aboutPage=${aboutPage.length} aboutGallery=${aboutGallery.length} ` +
      `faqs=${faqs.length} faqTranslations=${faqTranslations.length}`,
  );

  return {
    banners,
    bannerTranslations,
    products,
    productTranslations,
    productImages,
    productSpecifications,
    productCategories,
    categoryTranslations,
    articles,
    articleTranslations,
    articleProducts,
    articleCategories,
    articleCategoryTranslations,
    aboutPage,
    aboutGallery,
    faqs,
    faqTranslations,
    indices: {
      productById,
      productTransByLocaleSlug,
      productTransByProductLocale,
      productTransBySlug,
      productImagesByProduct,
      productSpecsByProductLocale,
      categoryTransByCategoryLocale,
      bannerTransByBannerLocale,
      articleById,
      articleTransByLocaleSlug,
      articleTransByArticleLocale,
      articleTransBySlug,
      articleProductsByArticle,
      articleCategoryTransByCatLocale,
      faqTransByFaqLocale,
      aboutByLocale,
      aboutGalleryByType,
    },
  };
}
