// Inserts the staged translations for products 128-147 into the missing
// locales. Reads tests/translations-<locale>-new20.json for each locale.
//
// Safe to re-run: it upserts product_translations by (productId, locale),
// replaces that locale's specs, and disambiguates slugs against existing rows.
//
//   npx tsx tests/insert-new20-translations.ts
//   npx tsx tests/insert-new20-translations.ts es it
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
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const argLocales = process.argv
    .slice(2)
    .filter((a) => (ALL_LOCALES as readonly string[]).includes(a));
  const locales = argLocales.length > 0
    ? (argLocales as (typeof ALL_LOCALES)[number][])
    : [...ALL_LOCALES];

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  const productRows = await db
    .select({ id: products.id, modelNumber: products.modelNumber })
    .from(products);
  const modelByProduct = new Map<number, string | null>(
    productRows.map((p) => [p.id, p.modelNumber]),
  );

  for (const locale of locales) {
    const path = `tests/translations-${locale}-new20.json`;
    const entries = JSON.parse(readFileSync(path, 'utf8')) as Entry[];

    await db.transaction(async (tx) => {
      for (const e of entries) {
        const modelNumber = modelByProduct.get(e.productId) ?? null;
        let desired = e.slug ? slugify(e.slug) : slugify(e.name);
        if (!desired) desired = `product-${e.productId}`;

        const candidates = [desired];
        const modelTok = modelNumber ? slugify(modelNumber) : '';
        if (modelTok) candidates.push(`${desired}-${modelTok}`);
        candidates.push(`${desired}-${e.productId}`);

        let finalSlug = candidates[candidates.length - 1];
        for (const candidate of candidates) {
          const clash = await tx
            .select({ id: productTranslations.id })
            .from(productTranslations)
            .where(
              and(
                eq(productTranslations.locale, locale),
                eq(productTranslations.slug, candidate),
                ne(productTranslations.productId, e.productId),
              ),
            )
            .limit(1);
          if (clash.length === 0) {
            finalSlug = candidate;
            break;
          }
        }

        const [existing] = await tx
          .select({ id: productTranslations.id })
          .from(productTranslations)
          .where(
            and(
              eq(productTranslations.productId, e.productId),
              eq(productTranslations.locale, locale),
            ),
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

        await tx
          .delete(productSpecifications)
          .where(
            and(
              eq(productSpecifications.productId, e.productId),
              eq(productSpecifications.locale, locale),
            ),
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

        console.log(
          `${locale} pid=${e.productId} slug=${finalSlug}${
            finalSlug !== desired ? ` (was ${desired})` : ''
          }`,
        );
      }
    });

    console.log(`done ${locale}: ${entries.length} entries`);
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
