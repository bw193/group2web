// Insert translated product content into the DB for one locale at a time.
// Usage: npx tsx tests/insert-translations.ts <locale> <jsonPath>
// e.g.:  npx tsx tests/insert-translations.ts es tests/translations-es.json
//
// The JSON file shape (per product):
//   {
//     productId: number,         // English product id (mapping key)
//     name: string,              // translated product name
//     shortDescription: string,  // translated, plain text (may include &amp;)
//     fullDescription: string,   // translated HTML (preserve <p> <strong> <ul> etc.)
//     specs: [{ key: string, value: string }]   // translated spec key/value
//   }
//
// The script:
//   1. Slugifies the translated name (lowercase, hyphenated, deduplicated per locale).
//   2. Deletes any existing rows for (locale, productId) in product_translations + product_specifications.
//   3. Inserts fresh rows.
//
// Safe to re-run; uses a transaction per locale.

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, inArray, and, eq } from 'drizzle-orm';
import { productTranslations, productSpecifications } from '../src/lib/db/schema';

type Entry = {
  productId: number;
  name: string;
  // Optional explicit slug. For locales whose script slugifies to empty
  // (e.g. Hebrew), pass the English slug so URLs stay clean ASCII instead of
  // falling back to `product-<id>`.
  slug?: string;
  shortDescription: string;
  fullDescription: string;
  specs: { key: string; value: string }[];
};

function slugify(s: string): string {
  // Drop diacritics, lowercase, replace any run of non-alphanumerics with a hyphen.
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
    console.error('Usage: npx tsx tests/insert-translations.ts <locale> <jsonPath>');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const raw = readFileSync(jsonPath, 'utf8');
  const entries = JSON.parse(raw) as Entry[];

  // Deduplicate slugs within this locale by appending the model number / product id when needed.
  const usedSlugs = new Set<string>();
  const finalSlugs = new Map<number, string>();
  for (const e of entries) {
    // Prefer an explicit English slug when provided (Hebrew/other non-Latin
    // names slugify to stray Latin tokens like "led", so the name is unsafe);
    // otherwise slugify the translated name. Fall back to the product id.
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

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  await db.transaction(async (tx) => {
    const ids = entries.map((e) => e.productId);
    if (ids.length === 0) {
      console.log('No entries to insert.');
      return;
    }

    // Wipe existing rows for this locale + these product ids.
    await tx
      .delete(productTranslations)
      .where(and(eq(productTranslations.locale, locale), inArray(productTranslations.productId, ids)));
    await tx
      .delete(productSpecifications)
      .where(and(eq(productSpecifications.locale, locale), inArray(productSpecifications.productId, ids)));

    for (const e of entries) {
      const slug = finalSlugs.get(e.productId)!;
      await tx.insert(productTranslations).values({
        productId: e.productId,
        locale,
        name: e.name,
        slug,
        shortDescription: e.shortDescription || null,
        fullDescription: e.fullDescription || null,
      });
      if (e.specs.length > 0) {
        await tx.insert(productSpecifications).values(
          e.specs.map((s) => ({
            productId: e.productId,
            locale,
            specKey: s.key,
            specValue: s.value,
          })),
        );
      }
    }
  });

  console.log(`Inserted ${entries.length} product translations for locale="${locale}".`);
  await client.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
