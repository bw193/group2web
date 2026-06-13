import { and, eq, ne, type SQL } from 'drizzle-orm';
import { productTranslations } from './db/schema';
import { slugify } from './utils';

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
    if (clashes.length === 0) return candidate;
  }
  throw new Error(`could not disambiguate slug "${args.slug}" for locale "${args.locale}"`);
}
