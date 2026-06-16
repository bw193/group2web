// Read-only audit: list every active product alongside which locales it has
// translation rows for. Flags products that are completely orphaned (zero
// translations, so invisible on the public site at every URL) and products
// with partial locale coverage. Does not change anything.
//
//   npx tsx tests/audit-orphan-products.ts
//
// Optional: `npx tsx tests/audit-orphan-products.ts --orphans-only` to dump
// only the products with zero translations.
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, asc } from 'drizzle-orm';
import { products, productTranslations } from '../src/lib/db/schema';

const LOCALES = ['en', 'es', 'pt', 'fr', 'it', 'de', 'he'] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const orphansOnly = process.argv.includes('--orphans-only');

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  const allProducts = await db
    .select({
      id: products.id,
      modelNumber: products.modelNumber,
      isActive: products.isActive,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.id));

  const allTrans = await db
    .select({
      productId: productTranslations.productId,
      locale: productTranslations.locale,
      slug: productTranslations.slug,
    })
    .from(productTranslations);

  const byProduct = new Map<number, Map<string, string>>();
  for (const t of allTrans) {
    const m = byProduct.get(t.productId) ?? new Map<string, string>();
    m.set(t.locale, t.slug);
    byProduct.set(t.productId, m);
  }

  const orphans: typeof allProducts = [];
  const partial: { p: (typeof allProducts)[number]; have: string[]; missing: string[] }[] = [];
  for (const p of allProducts) {
    const have = byProduct.get(p.id);
    if (!have || have.size === 0) {
      orphans.push(p);
      continue;
    }
    const missing = LOCALES.filter((l) => !have.has(l));
    if (missing.length > 0) {
      partial.push({ p, have: [...have.keys()], missing });
    }
  }

  console.log(`\nActive products: ${allProducts.length}`);
  console.log(`Orphans (zero translations, invisible on every URL): ${orphans.length}`);
  console.log(`Partial coverage (missing 1+ locales): ${partial.length}`);
  console.log(`Fully translated across all ${LOCALES.length} locales: ${allProducts.length - orphans.length - partial.length}\n`);

  if (orphans.length > 0) {
    console.log('--- Orphans ---');
    console.log('id'.padEnd(8) + 'modelNumber'.padEnd(28) + 'createdAt');
    for (const p of orphans) {
      console.log(
        String(p.id).padEnd(8) + String(p.modelNumber ?? '').padEnd(28) + String(p.createdAt ?? ''),
      );
    }
    console.log('');
  }

  if (!orphansOnly && partial.length > 0) {
    console.log('--- Partial coverage ---');
    console.log('id'.padEnd(8) + 'have'.padEnd(28) + 'missing');
    for (const { p, have, missing } of partial) {
      console.log(
        String(p.id).padEnd(8) +
          have.sort().join(',').padEnd(28) +
          missing.join(','),
      );
    }
    console.log('');
  }

  await client.end();
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
