// Find the active products that are missing translations for any non-EN locale,
// dump their English source content (name/slug/short/full + specs) to JSON.
// Usage: npx tsx tests/find-untranslated.ts <outPath>

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { writeFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const TARGET_LOCALES = ['es', 'pt', 'fr', 'it', 'de', 'he'];

async function main() {
  const [, , outPath] = process.argv;
  if (!outPath) {
    console.error('Usage: npx tsx tests/find-untranslated.ts <outPath>');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  // Per-locale missing product ids.
  const missingByLocale: Record<string, number[]> = {};
  for (const loc of TARGET_LOCALES) {
    const rows = (await db.execute(sql`
      SELECT p.id
      FROM products p
      WHERE p.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM product_translations pt
          WHERE pt.product_id = p.id AND pt.locale = ${loc}
        )
      ORDER BY p.id
    `)) as unknown as { id: number }[];
    missingByLocale[loc] = rows.map((r) => r.id);
  }

  // Union of missing product ids across all locales.
  const allMissing = new Set<number>();
  for (const loc of TARGET_LOCALES) for (const id of missingByLocale[loc]) allMissing.add(id);
  const ids = [...allMissing].sort((a, b) => a - b);

  // Pull English source content for those products.
  type Row = {
    product_id: number;
    name: string;
    slug: string;
    short_description: string | null;
    full_description: string | null;
    model_number: string | null;
    category_id: number | null;
  };
  const enRows = ids.length
    ? ((await db.execute(sql`
        SELECT pt.product_id, pt.name, pt.slug, pt.short_description, pt.full_description,
               p.model_number, p.category_id
        FROM product_translations pt
        JOIN products p ON p.id = pt.product_id
        WHERE pt.locale = 'en' AND pt.product_id IN ${sql.raw(`(${ids.join(',')})`)}
        ORDER BY pt.product_id
      `)) as unknown as Row[])
    : [];

  // Specs (English) per product.
  type SpecRow = { product_id: number; spec_key: string; spec_value: string };
  const specRows = ids.length
    ? ((await db.execute(sql`
        SELECT product_id, spec_key, spec_value
        FROM product_specifications
        WHERE locale = 'en' AND product_id IN ${sql.raw(`(${ids.join(',')})`)}
        ORDER BY product_id, id
      `)) as unknown as SpecRow[])
    : [];
  const specsByProduct = new Map<number, { key: string; value: string }[]>();
  for (const s of specRows) {
    const list = specsByProduct.get(s.product_id) ?? [];
    list.push({ key: s.spec_key, value: s.spec_value });
    specsByProduct.set(s.product_id, list);
  }

  const out = {
    missingByLocale,
    products: enRows.map((r) => ({
      productId: r.product_id,
      modelNumber: r.model_number,
      categoryId: r.category_id,
      name: r.name,
      slug: r.slug,
      shortDescription: r.short_description,
      fullDescription: r.full_description,
      specs: specsByProduct.get(r.product_id) ?? [],
    })),
  };
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${out.products.length} products to ${outPath}`);
  console.log('Missing counts:');
  for (const loc of TARGET_LOCALES) console.log(`  ${loc}: ${missingByLocale[loc].length}`);
  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
