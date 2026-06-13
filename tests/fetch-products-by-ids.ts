// Read-only dump of EN content + specs for specific product IDs into stdout.
//   npx tsx tests/fetch-products-by-ids.ts 121 125 126 127
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function main() {
  const ids = process.argv.slice(2).map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
  if (ids.length === 0) {
    console.error('Usage: npx tsx tests/fetch-products-by-ids.ts <id1> <id2> ...');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  const idList = sql.raw(ids.join(','));
  const rows = (await db.execute(sql`
    SELECT p.id AS product_id, p.model_number,
           pt.name, pt.slug, pt.short_description, pt.full_description
    FROM products p
    JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'en'
    WHERE p.id IN (${idList})
    ORDER BY p.id
  `)) as any[];

  const specs = (await db.execute(sql`
    SELECT product_id, spec_key, spec_value
    FROM product_specifications
    WHERE product_id IN (${idList}) AND locale = 'en'
    ORDER BY product_id, id
  `)) as any[];

  const specsByProduct: Record<number, { key: string; value: string }[]> = {};
  for (const s of specs) {
    (specsByProduct[s.product_id as number] ||= []).push({ key: s.spec_key, value: s.spec_value });
  }

  const out = rows.map((r) => ({
    productId: r.product_id,
    modelNumber: r.model_number,
    name: r.name,
    slug: r.slug,
    shortDescription: r.short_description,
    fullDescription: r.full_description,
    specs: specsByProduct[r.product_id] || [],
  }));

  console.log(JSON.stringify(out, null, 2));
  await client.end();
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
