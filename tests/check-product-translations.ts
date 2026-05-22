// Read-only audit of product translation coverage. Run with: npx tsx tests/check-product-translations.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = postgres(url);
  const db = drizzle(client);

  const totalProducts = await db.execute(
    sql`SELECT COUNT(*)::int AS n FROM products WHERE is_active = true`,
  );
  const totalAll = await db.execute(sql`SELECT COUNT(*)::int AS n FROM products`);

  const perLocale = await db.execute(sql`
    SELECT pt.locale, COUNT(*)::int AS n
    FROM product_translations pt
    JOIN products p ON p.id = pt.product_id
    WHERE p.is_active = true
    GROUP BY pt.locale
    ORDER BY pt.locale
  `);

  const specsPerLocale = await db.execute(sql`
    SELECT ps.locale, COUNT(*)::int AS n
    FROM product_specifications ps
    JOIN products p ON p.id = ps.product_id
    WHERE p.is_active = true
    GROUP BY ps.locale
    ORDER BY ps.locale
  `);

  const sampleTitles = await db.execute(sql`
    SELECT pt.product_id, pt.locale, pt.name, pt.slug,
           LENGTH(COALESCE(pt.short_description, '')) AS short_len,
           LENGTH(COALESCE(pt.full_description, '')) AS full_len
    FROM product_translations pt
    WHERE pt.product_id IN (
      SELECT id FROM products WHERE is_active = true ORDER BY id LIMIT 3
    )
    ORDER BY pt.product_id, pt.locale
  `);

  const missingLocaleCount = await db.execute(sql`
    WITH locales(locale) AS (
      VALUES ('en'),('es'),('pt'),('fr'),('it'),('de')
    ),
    grid AS (
      SELECT p.id AS product_id, l.locale
      FROM products p CROSS JOIN locales l
      WHERE p.is_active = true
    )
    SELECT g.locale, COUNT(*)::int AS missing
    FROM grid g
    LEFT JOIN product_translations pt
      ON pt.product_id = g.product_id AND pt.locale = g.locale
    WHERE pt.id IS NULL
    GROUP BY g.locale
    ORDER BY g.locale
  `);

  console.log('Total products (all):', totalAll[0]?.n);
  console.log('Total products (active):', totalProducts[0]?.n);
  console.log('\nproduct_translations rows per locale (active products only):');
  console.table(perLocale);
  console.log('\nproduct_specifications rows per locale (active products only):');
  console.table(specsPerLocale);
  console.log('\nMissing translations per locale (active products):');
  console.table(missingLocaleCount);
  console.log('\nSample translation rows for first 3 active products:');
  console.table(sampleTitles);

  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
