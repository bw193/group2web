// Read-only dump of every active product's English content + specs into a JSON file.
// Run with: npx tsx tests/dump-english-content.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { writeFileSync } from 'node:fs';
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

  const rows = await db.execute(sql`
    SELECT
      p.id AS product_id,
      p.model_number,
      pt.name,
      pt.slug,
      pt.short_description,
      pt.full_description
    FROM products p
    JOIN product_translations pt
      ON pt.product_id = p.id AND pt.locale = 'en'
    WHERE p.is_active = true
    ORDER BY p.id
  `);

  const specs = await db.execute(sql`
    SELECT
      ps.product_id,
      ps.spec_key,
      ps.spec_value
    FROM product_specifications ps
    JOIN products p ON p.id = ps.product_id
    WHERE p.is_active = true AND ps.locale = 'en'
    ORDER BY ps.product_id, ps.id
  `);

  const specsByProduct: Record<number, { key: string; value: string }[]> = {};
  for (const s of specs as any[]) {
    const pid = s.product_id as number;
    (specsByProduct[pid] ||= []).push({ key: s.spec_key, value: s.spec_value });
  }

  const out = (rows as any[]).map((r) => ({
    productId: r.product_id,
    modelNumber: r.model_number,
    name: r.name,
    slug: r.slug,
    shortDescription: r.short_description,
    fullDescription: r.full_description,
    specs: specsByProduct[r.product_id] || [],
  }));

  const fullLenTotal = out.reduce(
    (acc, p) => acc + (p.fullDescription?.length || 0) + (p.shortDescription?.length || 0),
    0,
  );
  const specCount = out.reduce((acc, p) => acc + p.specs.length, 0);

  writeFileSync('tests/products-en.json', JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${out.length} products to tests/products-en.json`);
  console.log(`Total description characters: ${fullLenTotal.toLocaleString()}`);
  console.log(`Total spec rows: ${specCount}`);

  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
