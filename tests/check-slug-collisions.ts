// Given a locale and a translations JSON, predict slug collisions vs existing rows.
// Usage: npx tsx tests/check-slug-collisions.ts <locale> <jsonPath>

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function main() {
  const [, , locale, jsonPath] = process.argv;
  if (!locale || !jsonPath) {
    console.error('Usage: npx tsx tests/check-slug-collisions.ts <locale> <jsonPath>');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL!;
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  type E = { productId: number; name: string; slug?: string };
  const entries = JSON.parse(readFileSync(jsonPath, 'utf8')) as E[];
  const incomingIds = new Set(entries.map((e) => e.productId));

  // Build the slugs the insert script would produce, with intra-batch dedupe.
  const usedSlugs = new Set<string>();
  const finalSlugs = new Map<number, string>();
  for (const e of entries) {
    let base = e.slug ? slugify(e.slug) : slugify(e.name);
    if (!base) base = `product-${e.productId}`;
    let candidate = base;
    let n = 2;
    while (usedSlugs.has(candidate)) {
      candidate = `${base}-${n}`;
      n += 1;
    }
    usedSlugs.add(candidate);
    finalSlugs.set(e.productId, candidate);
  }

  // Pull existing rows for this locale.
  type Row = { product_id: number; slug: string; name: string };
  const existing = (await db.execute(sql`
    SELECT product_id, slug, name FROM product_translations WHERE locale = ${locale}
  `)) as unknown as Row[];
  const existingBySlug = new Map(existing.map((r) => [r.slug, r] as const));

  const collisions: { productId: number; name: string; slug: string; existing: Row }[] = [];
  for (const e of entries) {
    const slug = finalSlugs.get(e.productId)!;
    const hit = existingBySlug.get(slug);
    if (hit && !incomingIds.has(hit.product_id)) {
      collisions.push({ productId: e.productId, name: e.name, slug, existing: hit });
    }
  }

  if (collisions.length === 0) {
    console.log(`No collisions for locale=${locale}.`);
  } else {
    console.log(`Collisions for locale=${locale}: ${collisions.length}`);
    for (const c of collisions) {
      console.log(`  pid=${c.productId} name="${c.name}" slug="${c.slug}" collides with existing pid=${c.existing.product_id} ("${c.existing.name}")`);
    }
  }

  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
