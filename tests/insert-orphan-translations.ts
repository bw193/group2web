// Inserts the fix-up translations for products 121, 125, 126, 127 into the 6
// missing locales (es, pt, fr, it, de, he). Reads tests/translations-<loc>-orphan-fix.json
// for each locale, and:
//
//   1. Slugifies the name (unless an explicit slug is provided — Hebrew uses
//      the English ASCII slug to keep URLs readable).
//   2. Pre-checks (locale, slug) against every other product's existing
//      translation row in product_translations. On clash, falls back to
//      `${slug}-${slugify(modelNumber)}`; on further clash, `${slug}-${productId}`.
//   3. Inserts (or updates if a row already exists for this product+locale)
//      under one db.transaction per locale, so a mid-loop failure rolls back.
//
//   npx tsx tests/insert-orphan-translations.ts            # all 6 locales
//   npx tsx tests/insert-orphan-translations.ts es it      # subset
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq, inArray, ne } from 'drizzle-orm';
import { productTranslations, productSpecifications } from '../src/lib/db/schema';

const ALL_LOCALES = ['es', 'pt', 'fr', 'it', 'de', 'he'] as const;

type Entry = {
  productId: number;
  name: string;
  slug?: string;
  shortDescription: string;
  fullDescription: string;
  specs: { key: string; value: string }[];
};

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const argLocales = process.argv.slice(2).filter((a) => (ALL_LOCALES as readonly string[]).includes(a));
  const locales = argLocales.length > 0 ? (argLocales as (typeof ALL_LOCALES)[number][]) : [...ALL_LOCALES];

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  for (const locale of locales) {
    const path = `tests/translations-${locale}-orphan-fix.json`;
    const entries = JSON.parse(readFileSync(path, 'utf8')) as Entry[];

    await db.transaction(async (tx) => {
      const ids = entries.map((e) => e.productId);
      const existingRows = ids.length
        ? await tx
            .select({
              id: productTranslations.id,
              productId: productTranslations.productId,
              slug: productTranslations.slug,
            })
            .from(productTranslations)
            .where(and(eq(productTranslations.locale, locale), inArray(productTranslations.productId, ids)))
        : [];
      const englishRows = ids.length
        ? await tx
            .select({ productId: productTranslations.productId, slug: productTranslations.slug })
            .from(productTranslations)
            .where(and(eq(productTranslations.locale, 'en'), inArray(productTranslations.productId, ids)))
        : [];
      const existingByProduct = new Map(existingRows.map((r) => [r.productId, r]));
      const englishSlugByProduct = new Map(englishRows.map((r) => [r.productId, r.slug]));

      for (const e of entries) {
        const existing = existingByProduct.get(e.productId);
        const finalSlug = existing?.slug ?? englishSlugByProduct.get(e.productId);
        if (!finalSlug) {
          throw new Error(`No English slug found for product ${e.productId}; cannot insert ${locale} translation`);
        }

        const clash = await tx
          .select({ productId: productTranslations.productId })
          .from(productTranslations)
          .where(
            and(
              eq(productTranslations.locale, locale),
              eq(productTranslations.slug, finalSlug),
              ne(productTranslations.productId, e.productId),
            ),
          )
          .limit(1);
        if (clash.length > 0) {
          throw new Error(`Slug "${finalSlug}" is already used by product ${clash[0].productId} in ${locale}`);
        }

        // Upsert: replace this product's existing (productId, locale) row.
        if (existing) {
          await tx
            .update(productTranslations)
            .set({
              name: e.name,
              slug: finalSlug,
              shortDescription: e.shortDescription || null,
              fullDescription: e.fullDescription || null,
            })
            .where(eq(productTranslations.id, existing.id));
        } else {
          await tx.insert(productTranslations).values({
            productId: e.productId,
            locale,
            name: e.name,
            slug: finalSlug,
            shortDescription: e.shortDescription || null,
            fullDescription: e.fullDescription || null,
          });
        }

        // Replace the (productId, locale) specs.
        await tx
          .delete(productSpecifications)
          .where(
            and(eq(productSpecifications.productId, e.productId), eq(productSpecifications.locale, locale)),
          );
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

        console.log(`  ${locale}  pid=${e.productId}  slug=${finalSlug}${existing ? '  (preserved)' : '  (copied from en)'}`);
      }
    });

    console.log(`done ${locale}: ${entries.length} entries`);
  }

  await client.end();
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
