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
//   1. Preserves existing localized product slugs, so old product URLs do not
//      change when translations are refreshed.
//   2. Uses the English product slug for any newly inserted locale row.
//   3. Deletes/reinserts content rows for this locale + product ids.
//
// Safe to re-run; uses a transaction per locale.

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { inArray, and, eq, ne } from 'drizzle-orm';
import { productTranslations, productSpecifications } from '../src/lib/db/schema';

type Entry = {
  productId: number;
  name: string;
  // Ignored for non-English imports. Existing localized slugs are preserved;
  // newly inserted localized rows use the English product slug.
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

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  await db.transaction(async (tx) => {
    const ids = entries.map((e) => e.productId);
    if (ids.length === 0) {
      console.log('No entries to insert.');
      return;
    }

    const existingRows = await tx
      .select({ productId: productTranslations.productId, slug: productTranslations.slug })
      .from(productTranslations)
      .where(and(eq(productTranslations.locale, locale), inArray(productTranslations.productId, ids)));
    const englishRows = await tx
      .select({ productId: productTranslations.productId, slug: productTranslations.slug })
      .from(productTranslations)
      .where(and(eq(productTranslations.locale, 'en'), inArray(productTranslations.productId, ids)));
    const existingSlugByProduct = new Map(existingRows.map((r) => [r.productId, r.slug]));
    const englishSlugByProduct = new Map(englishRows.map((r) => [r.productId, r.slug]));
    const finalSlugs = new Map<number, string>();

    for (const e of entries) {
      const slug = existingSlugByProduct.get(e.productId) ?? englishSlugByProduct.get(e.productId);
      if (!slug) {
        throw new Error(`No English slug found for product ${e.productId}; cannot insert ${locale} translation`);
      }
      const clash = await tx
        .select({ productId: productTranslations.productId })
        .from(productTranslations)
        .where(
          and(
            eq(productTranslations.locale, locale),
            eq(productTranslations.slug, slug),
            ne(productTranslations.productId, e.productId),
          ),
        )
        .limit(1);
      if (clash.length > 0) {
        throw new Error(`Slug "${slug}" is already used by product ${clash[0].productId} in ${locale}`);
      }
      finalSlugs.set(e.productId, slug);
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
