import { and, eq, ne, type SQL } from 'drizzle-orm';
import { productSlugHistory, productTranslations } from './db/schema';
import { slugForLocaleFromEnglish } from './localized-slugs';
import { slugify } from './utils';

export const PRODUCT_SLUG_SOURCE_LOCALE = 'en';

export function resolveProductTranslationSlug(args: {
  locale: string;
  englishSlug: string;
  existingSlug?: string | null;
}): string {
  if (args.locale === PRODUCT_SLUG_SOURCE_LOCALE) return args.englishSlug;
  const generatedSlug = slugForLocaleFromEnglish(args.locale, args.englishSlug);
  if (generatedSlug !== args.englishSlug) return generatedSlug;
  return args.existingSlug || args.englishSlug;
}

export function productSlugFromInput(input: {
  slug?: string | null;
  name?: string | null;
}): string {
  return slugify(input.slug?.trim() || input.name?.trim() || '');
}

/**
 * Returns a (locale, slug) value guaranteed not to collide with another
 * product's translation row. Tries the editor's slug first; on conflict
 * appends the slugified model number; falls back to the product id (which is
 * globally unique, so this can never loop forever). Pass `excludeProductId`
 * so PUT updates don't trip on the product's own existing row.
 */
export async function disambiguateProductSlug(
  // Accepts either the top-level db or a transaction handle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  args: {
    locale: string;
    slug: string;
    modelNumber: string | null | undefined;
    productId: number;
    excludeProductId?: number;
  },
): Promise<string> {
  const candidates: string[] = [args.slug];
  const modelTok = args.modelNumber ? slugify(args.modelNumber) : '';
  if (modelTok) candidates.push(`${args.slug}-${modelTok}`);
  candidates.push(`${args.slug}-${args.productId}`);

  for (const candidate of candidates) {
    const conditions: SQL[] = [
      eq(productTranslations.locale, args.locale),
      eq(productTranslations.slug, candidate),
    ];
    if (args.excludeProductId != null) {
      conditions.push(ne(productTranslations.productId, args.excludeProductId));
    }
    const clashes = await tx
      .select({ id: productTranslations.id })
      .from(productTranslations)
      .where(and(...conditions))
      .limit(1);
    if (clashes.length > 0) continue;

    const historyConditions: SQL[] = [
      eq(productSlugHistory.locale, args.locale),
      eq(productSlugHistory.oldSlug, candidate),
    ];
    if (args.excludeProductId != null) {
      historyConditions.push(ne(productSlugHistory.productId, args.excludeProductId));
    }
    const historyClashes = await tx
      .select({ id: productSlugHistory.id })
      .from(productSlugHistory)
      .where(and(...historyConditions))
      .limit(1);
    if (historyClashes.length === 0) return candidate;
  }
  throw new Error(`could not disambiguate slug "${args.slug}" for locale "${args.locale}"`);
}

/**
 * Finalizes one English source slug so it can be copied into every newly
 * inserted locale row in `locales`. Existing non-English rows keep their own
 * stored slug and should not be included by callers.
 */
export async function disambiguateSharedProductSlug(
  // Accepts either the top-level db or a transaction handle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  args: {
    locales: readonly string[];
    slug: string;
    modelNumber: string | null | undefined;
    productId: number;
    excludeProductId?: number;
  },
): Promise<string> {
  const locales = Array.from(new Set(args.locales.filter(Boolean)));
  if (locales.length === 0) {
    throw new Error('cannot disambiguate product slug without target locales');
  }

  const candidates: string[] = [args.slug];
  const modelTok = args.modelNumber ? slugify(args.modelNumber) : '';
  if (modelTok) candidates.push(`${args.slug}-${modelTok}`);
  candidates.push(`${args.slug}-${args.productId}`);

  for (const candidate of candidates) {
    let hasClash = false;
    for (const locale of locales) {
      const localeSlug = resolveProductTranslationSlug({ locale, englishSlug: candidate });
      const conditions: SQL[] = [
        eq(productTranslations.locale, locale),
        eq(productTranslations.slug, localeSlug),
      ];
      if (args.excludeProductId != null) {
        conditions.push(ne(productTranslations.productId, args.excludeProductId));
      }
      const clashes = await tx
        .select({ id: productTranslations.id })
        .from(productTranslations)
        .where(and(...conditions))
        .limit(1);
      if (clashes.length > 0) {
        hasClash = true;
        break;
      }

      const historyConditions: SQL[] = [
        eq(productSlugHistory.locale, locale),
        eq(productSlugHistory.oldSlug, localeSlug),
      ];
      if (args.excludeProductId != null) {
        historyConditions.push(ne(productSlugHistory.productId, args.excludeProductId));
      }
      const historyClashes = await tx
        .select({ id: productSlugHistory.id })
        .from(productSlugHistory)
        .where(and(...historyConditions))
        .limit(1);
      if (historyClashes.length > 0) {
        hasClash = true;
        break;
      }
    }
    if (!hasClash) return candidate;
  }
  throw new Error(`could not disambiguate shared product slug "${args.slug}"`);
}
