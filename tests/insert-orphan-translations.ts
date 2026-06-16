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
import { and, eq, ne } from 'drizzle-orm';
import { products, productTranslations, productSpecifications } from '../src/lib/db/schema';

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

  // modelNumber per product, used for disambiguation suffixes
  const productRows = await db.select({ id: products.id, modelNumber: products.modelNumber }).from(products);
  const modelByProduct = new Map<number, string | null>(productRows.map((p) => [p.id, p.modelNumber]));

  for (const locale of locales) {
    const path = `tests/translations-${locale}-orphan-fix.json`;
    const entries = JSON.parse(readFileSync(path, 'utf8')) as Entry[];

    await db.transaction(async (tx) => {
      for (const e of entries) {
        const modelNumber = modelByProduct.get(e.productId) ?? null;
        let desired = e.slug ? slugify(e.slug) : slugify(e.name);
        if (!desired) desired = `product-${e.productId}`;

        // Disambiguate (locale, slug) against any OTHER product's existing row.
        const candidates = [desired];
        const modelTok = modelNumber ? slugify(modelNumber) : '';
        if (modelTok) candidates.push(`${desired}-${modelTok}`);
        candidates.push(`${desired}-${e.productId}`);

        let finalSlug = candidates[candidates.length - 1];
        for (const c of candidates) {
          const clash = await tx
            .select({ id: productTranslations.id })
            .from(productTranslations)
            .where(
              and(
                eq(productTranslations.locale, locale),
                eq(productTranslations.slug, c),
                ne(productTranslations.productId, e.productId),
              ),
            )
            .limit(1);
          if (clash.length === 0) {
            finalSlug = c;
            break;
          }
        }

        // Upsert: replace this product's existing (productId, locale) row.
        const [existing] = await tx
          .select({ id: productTranslations.id })
          .from(productTranslations)
          .where(
            and(eq(productTranslations.productId, e.productId), eq(productTranslations.locale, locale)),
          )
          .limit(1);

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

        console.log(`  ${locale}  pid=${e.productId}  slug=${finalSlug}${finalSlug !== desired ? `  (was: ${desired})` : ''}`);
      }
    });

    console.log(`done ${locale}: ${entries.length} entries`);
  }

  await client.end();
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
