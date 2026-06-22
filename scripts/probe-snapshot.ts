// Standalone probe to verify the warm logic without going through next build.
// Run: tsx scripts/probe-snapshot.ts
//
// Inlines the same Promise.all of 17 SELECTs that build-cache.ts runs, so we
// can confirm Supabase connectivity + measure the realistic warm wall-time
// without Next.js worker orchestration in the picture.
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as S from '../src/lib/db/schema';

async function main() {
  const url = process.env.DATABASE_URL!;
  const poolMax = Number(process.env.PROBE_POOL_MAX ?? 1);
  const client = postgres(url, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: poolMax,
    idle_timeout: 20,
    connect_timeout: 30,
  });
  console.log(`probe: pool max=${poolMax}`);
  const db = drizzle(client, { schema: S });

  const t0 = Date.now();
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
  const t1 = Date.now();

  console.log(`warm completed in ${t1 - t0}ms`);
  console.log(
    `  products=${products.length} productTranslations=${productTranslations.length} ` +
      `productImages=${productImages.length} productSpecifications=${productSpecifications.length}`,
  );
  console.log(
    `  articles=${articles.length} articleTranslations=${articleTranslations.length} ` +
      `articleProducts=${articleProducts.length}`,
  );
  console.log(
    `  categories=${productCategories.length} categoryTranslations=${categoryTranslations.length} ` +
      `banners=${banners.length} bannerTranslations=${bannerTranslations.length}`,
  );
  console.log(
    `  articleCategories=${articleCategories.length} ` +
      `articleCategoryTranslations=${articleCategoryTranslations.length} ` +
      `aboutPage=${aboutPage.length} aboutGallery=${aboutGallery.length} ` +
      `faqs=${faqs.length} faqTranslations=${faqTranslations.length}`,
  );

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('probe failed:', err);
  process.exit(1);
});
