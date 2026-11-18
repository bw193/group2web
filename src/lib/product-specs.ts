import { and, asc, eq, inArray } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { productSpecifications } from '@/lib/db/schema';

/**
 * The CMS edits English specs only. The other languages come from the
 * translation run, which writes them straight to the database.
 */
export const PRODUCT_SPEC_SOURCE_LOCALE = 'en';

/** A stored spec row. */
export interface ProductSpecRow {
  locale: string;
  specKey: string;
  specValue: string;
}

/** A spec row as a product save sends it; a row without a locale is English. */
export interface ProductSpecInput {
  locale?: string | null;
  key: string;
  value: string;
}

export interface ProductSpecUpdatePlan {
  /** Locales whose stored rows the save deletes. */
  deleteLocales: string[];
  /** Rows the save inserts after the deletes, in display order. */
  insertRows: ProductSpecRow[];
  /** True when the English keys or values changed, not just their order. */
  englishChanged: boolean;
}

function sameRowsInOrder(a: readonly ProductSpecRow[], b: readonly ProductSpecRow[]): boolean {
  return a.length === b.length
    && a.every((row, i) => row.specKey === b[i].specKey && row.specValue === b[i].specValue);
}

function sameRowsAnyOrder(a: readonly ProductSpecRow[], b: readonly ProductSpecRow[]): boolean {
  if (a.length !== b.length) return false;
  const counts = new Map<string, number>();
  for (const row of a) {
    const id = JSON.stringify([row.specKey, row.specValue]);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const row of b) {
    const id = JSON.stringify([row.specKey, row.specValue]);
    const left = counts.get(id) ?? 0;
    if (left === 0) return false;
    counts.set(id, left - 1);
  }
  return true;
}

/**
 * Works out what a product save does to the spec rows.
 *
 * The CMS sends English only, so replacing every language's rows on each save
 * would empty the six translated tables until the next translation run, even
 * when the save only fixed a typo in the description. Instead:
 * - a language is rewritten only when the rows sent for it differ from the
 *   stored ones (English always counts as sent, so an empty list clears it);
 * - languages the save didn't send keep their rows, unless the English keys or
 *   values changed. Then those translations describe old specs, so they are
 *   cleared and the next translation run writes them again.
 *
 * `existing` must be in id order, the order the rows were written.
 */
export function planProductSpecUpdate(
  existing: readonly ProductSpecRow[],
  incoming: readonly ProductSpecInput[],
): ProductSpecUpdatePlan {
  const sent = new Map<string, ProductSpecRow[]>([[PRODUCT_SPEC_SOURCE_LOCALE, []]]);
  for (const spec of incoming) {
    const locale = spec.locale || PRODUCT_SPEC_SOURCE_LOCALE;
    const rows = sent.get(locale) ?? [];
    rows.push({ locale, specKey: spec.key, specValue: spec.value });
    sent.set(locale, rows);
  }
  const storedRows = (locale: string) => existing.filter((row) => row.locale === locale);

  const deleteLocales: string[] = [];
  const insertRows: ProductSpecRow[] = [];
  for (const [locale, rows] of sent) {
    const stored = storedRows(locale);
    if (sameRowsInOrder(stored, rows)) continue;
    if (stored.length > 0) deleteLocales.push(locale);
    insertRows.push(...rows);
  }

  const englishChanged = !sameRowsAnyOrder(
    storedRows(PRODUCT_SPEC_SOURCE_LOCALE),
    sent.get(PRODUCT_SPEC_SOURCE_LOCALE) ?? [],
  );
  if (englishChanged) {
    for (const locale of new Set(existing.map((row) => row.locale))) {
      if (!sent.has(locale)) deleteLocales.push(locale);
    }
  }

  return { deleteLocales, insertRows, englishChanged };
}

/**
 * Saves a product's specs inside the caller's transaction, as
 * planProductSpecUpdate describes. Returns the plan it carried out.
 */
export async function saveProductSpecifications(
  tx: Pick<DB, 'select' | 'insert' | 'delete'>,
  productId: number,
  incoming: readonly ProductSpecInput[],
): Promise<ProductSpecUpdatePlan> {
  const existing = await tx
    .select({
      locale: productSpecifications.locale,
      specKey: productSpecifications.specKey,
      specValue: productSpecifications.specValue,
    })
    .from(productSpecifications)
    .where(eq(productSpecifications.productId, productId))
    .orderBy(asc(productSpecifications.id));

  const plan = planProductSpecUpdate(existing, incoming);
  if (plan.deleteLocales.length > 0) {
    await tx
      .delete(productSpecifications)
      .where(and(
        eq(productSpecifications.productId, productId),
        inArray(productSpecifications.locale, plan.deleteLocales),
      ));
  }
  if (plan.insertRows.length > 0) {
    await tx
      .insert(productSpecifications)
      .values(plan.insertRows.map((row) => ({ productId, ...row })));
  }
  return plan;
}
