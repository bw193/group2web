// Read-only verification of the Insight tables in prod (per insight-feature.md
// cheatsheet) + a survey of existing image assets for the cover backfill.
// Run with: npx tsx tests/check-insight-db.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import postgres from 'postgres';

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      console.error(`[retry] ${label} attempt ${i}/${attempts} failed: ${(e as Error).message}`);
      if (i < attempts) await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw lastErr;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const sql = postgres(url, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
  });

  try {
    const counts = await withRetry('counts', async () => ({
      articles: (await sql`SELECT count(*)::int AS n FROM articles`)[0].n,
      translations: (await sql`SELECT count(*)::int AS n FROM article_translations`)[0].n,
      articleProducts: (await sql`SELECT count(*)::int AS n FROM article_products`)[0].n,
    }));
    console.log('COUNTS:', JSON.stringify(counts));

    const locales = await sql`
      SELECT locale, count(*)::int AS n FROM article_translations GROUP BY locale ORDER BY locale`;
    console.log('LOCALES:', JSON.stringify(locales));

    const rls = await sql`
      SELECT relname, relrowsecurity FROM pg_class
      WHERE relname IN ('articles', 'article_translations', 'article_products')`;
    console.log('RLS:', JSON.stringify(rls));

    const arts = await sql`
      SELECT a.id, a.category, a.cover_image_url, a.thumbnail_url, a.is_active,
             t.slug, t.title
      FROM articles a
      LEFT JOIN article_translations t ON t.article_id = a.id AND t.locale = 'en'
      ORDER BY a.published_at DESC`;
    console.log('ARTICLES:');
    for (const a of arts) {
      console.log(
        `  #${a.id} [${a.category}] cover=${a.cover_image_url ?? 'NULL'} thumb=${a.thumbnail_url ?? 'NULL'} active=${a.is_active} slug=${a.slug}`,
      );
    }

    // Image survey for the cover backfill: primary product images with their
    // English names, and the about/facility gallery.
    const prodImgs = await sql`
      SELECT pi.image_url, pt.name
      FROM product_images pi
      JOIN products p ON p.id = pi.product_id AND p.is_active = true
      LEFT JOIN product_translations pt ON pt.product_id = pi.product_id AND pt.locale = 'en'
      WHERE pi.is_primary = true
      ORDER BY pi.product_id
      LIMIT 60`;
    console.log('PRODUCT_PRIMARY_IMAGES:');
    for (const r of prodImgs) console.log(`  ${r.name} :: ${r.image_url}`);

    const gallery = await sql`
      SELECT image_type, image_url FROM about_gallery ORDER BY image_type, display_order LIMIT 60`;
    console.log('ABOUT_GALLERY:');
    for (const r of gallery) console.log(`  [${r.image_type}] ${r.image_url}`);

    // Which products are linked to which articles (cover candidates too).
    const links = await sql`
      SELECT ap.article_id, pt.name, pi.image_url
      FROM article_products ap
      LEFT JOIN product_translations pt ON pt.product_id = ap.product_id AND pt.locale = 'en'
      LEFT JOIN product_images pi ON pi.product_id = ap.product_id AND pi.is_primary = true
      ORDER BY ap.article_id, ap.display_order`;
    console.log('ARTICLE_PRODUCT_LINKS:');
    for (const r of links) console.log(`  article ${r.article_id} -> ${r.name} :: ${r.image_url ?? 'no-img'}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error('FAILED:', e);
    process.exit(1);
  },
);
