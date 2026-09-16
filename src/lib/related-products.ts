import { defaultLocale } from '@/i18n/config';
import { DESCRIPTION_SHINGLE_WIDTH, NAME_SHINGLE_WIDTH, jaccardOfSets, shingles, wordTokens } from '@/lib/similarity';

/**
 * Which products the "Related products" block shows.
 *
 * The block used to take the first three active products in the category, so
 * the same twelve products — three per category — appeared on every sibling
 * page, while 137 of 163 products were linked from the catalog alone (F-04 in
 * the 2026-09-15 SEO audit). Internal links are how Google discovers pages and
 * judges how important they are, so a product reachable only from one 700 KB
 * listing page is one it has little reason to crawl often or rank.
 *
 * Siblings are now ranked by how similar they actually are, reusing the same
 * lexical primitives as the CMS similarity check (`@/lib/similarity`), so the
 * three cards are the nearest products in the category rather than whichever
 * happened to be created first. A buyer looking at an oval backlit mirror sees
 * other oval backlit mirrors, and the anchor text around each link describes a
 * genuinely near neighbour.
 *
 * Scoring is deliberately weighted towards the shortest, most factual text:
 *
 * - **name** (unigram overlap, ×3) — names carry the attributes buyers search
 *   for: shape, frame material, lighting, cabinet vs mirror.
 * - **specifications** (unigram overlap, ×2) — confirms those attributes from
 *   structured data: shape, dimensions, IP rating, frame.
 * - **short description** (3-word shingles, ×1) — weak on purpose. The copy is
 *   deliberately de-duplicated across the catalog, so it discriminates less.
 * - **tags** (×1) and **model series prefix** (×0.5) — cheap bonuses that pull
 *   a family (CTL05…, G2012…) together.
 *
 * The last card is reserved for the category neighbour — the next product in
 * the catalog's own order, wrapping at the end. Ranking by similarity alone
 * left 15 of 163 products with no inbound link at all (measured on the live
 * catalog): a product can be nobody's nearest neighbour, and those are exactly
 * the pages F-04 is about. Because every product is the successor of exactly
 * one other, the reserved slot guarantees each one is linked from at least one
 * sibling page, while the first two cards stay the nearest matches. If the
 * successor is already one of those two, the slot moves to the next unused
 * product and the successor keeps its link through similarity instead.
 *
 * Two further properties this keeps on purpose:
 *
 * - **Stable.** Ties break on the catalog's own order (newest first, id as the
 *   final tie-break), so the link graph does not churn between ISR
 *   regenerations, and a category whose products share no wording at all still
 *   returns a full set of cards instead of an empty block.
 * - **Locale-independent.** Scoring always reads the default-locale rows, so
 *   every language links the same products together and Google sees one
 *   internal structure rather than seven.
 */

export type RelatedProductRow = {
  id: number;
  categoryId: number | null;
  isActive: boolean;
  createdAt: string;
  modelNumber: string | null;
  tags: string | null;
};

export type RelatedTextRow = {
  productId: number;
  locale: string;
  name: string;
  shortDescription: string | null;
};

export type RelatedSpecRow = {
  productId: number;
  locale: string;
  specKey: string;
  specValue: string;
};

/** How many siblings each product links to. Matches the three-column card grid. */
export const RELATED_PRODUCT_COUNT = 3;

const WEIGHT = { name: 3, specs: 2, short: 1, tags: 1, series: 0.5 } as const;

/** Enough of a model number to identify a series: "CTL0061D-QFB" -> "ctl0061d". */
function seriesKey(modelNumber: string | null): string {
  const normalized = (modelNumber ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  return normalized.slice(0, 6);
}

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.filter((tag): tag is string => typeof tag === 'string');
  } catch {
    /* fall through to the comma-separated form */
  }
  return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
}

type Prepared = {
  name: Set<string>;
  specs: Set<string>;
  short: Set<string>;
  tags: Set<string>;
  series: string;
};

function prepare(
  product: RelatedProductRow,
  translations: readonly RelatedTextRow[],
  specs: readonly RelatedSpecRow[],
  locale: string,
): Prepared {
  const text = translations.find((t) => t.productId === product.id && t.locale === locale);
  const specText = specs
    .filter((s) => s.productId === product.id && s.locale === locale)
    .map((s) => `${s.specKey} ${s.specValue}`)
    .join('. ');
  return {
    name: shingles(wordTokens(text?.name ?? '', locale), NAME_SHINGLE_WIDTH),
    specs: shingles(wordTokens(specText, locale), NAME_SHINGLE_WIDTH),
    short: shingles(wordTokens(text?.shortDescription ?? '', locale), DESCRIPTION_SHINGLE_WIDTH),
    tags: new Set(parseTags(product.tags).map((tag) => tag.toLowerCase())),
    series: seriesKey(product.modelNumber),
  };
}

/** 0 when two products share nothing; higher means a closer neighbour. */
export function relatednessScore(a: Prepared, b: Prepared): number {
  return (
    WEIGHT.name * jaccardOfSets(a.name, b.name) +
    WEIGHT.specs * jaccardOfSets(a.specs, b.specs) +
    WEIGHT.short * jaccardOfSets(a.short, b.short) +
    WEIGHT.tags * jaccardOfSets(a.tags, b.tags) +
    WEIGHT.series * (a.series && a.series === b.series ? 1 : 0)
  );
}

/** Newest first, id ascending as the tie-break, matching the catalog's order. */
export function orderCategoryProducts<T extends RelatedProductRow>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    const byDate = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (Number.isFinite(byDate) && byDate !== 0) return byDate;
    return a.id - b.id;
  });
}

export type PickRelatedOptions = {
  /** How many cards to return. */
  count?: number;
  /** Which locale's rows to score. Defaults to the reference locale. */
  locale?: string;
  /**
   * How many of the cards are reserved for the category neighbour rather than
   * similarity. One slot is what guarantees no product is left unlinked; set
   * it to 0 for pure similarity, and accept that some products get no links.
   */
  neighbourSlots?: number;
};

export function pickRelatedProducts<T extends RelatedProductRow>(
  current: RelatedProductRow,
  products: readonly T[],
  translations: readonly RelatedTextRow[],
  specs: readonly RelatedSpecRow[],
  options: PickRelatedOptions = {},
): T[] {
  const { count = RELATED_PRODUCT_COUNT, locale = defaultLocale, neighbourSlots = 1 } = options;
  if (current.categoryId === null || count <= 0) return [];

  // Stable order first, so equal scores resolve the same way every render.
  const ordered = orderCategoryProducts(
    products.filter((p) => p.isActive && p.categoryId === current.categoryId),
  );
  const siblings = ordered.filter((p) => p.id !== current.id);
  if (siblings.length === 0) return [];

  const self = prepare(current, translations, specs, locale);
  const byRelatedness = siblings
    .map((product, index) => ({
      product,
      index,
      score: relatednessScore(self, prepare(product, translations, specs, locale)),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const picked: T[] = [];
  const taken = new Set<number>();
  for (const entry of byRelatedness) {
    if (picked.length >= Math.max(0, count - neighbourSlots)) break;
    picked.push(entry.product);
    taken.add(entry.product.id);
  }

  // Reserved slot(s): walk forward from this product in the catalog's order.
  const selfIndex = ordered.findIndex((p) => p.id === current.id);
  const start = selfIndex === -1 ? 0 : selfIndex + 1;
  for (let step = 0; step < ordered.length && picked.length < count; step += 1) {
    const candidate = ordered[(start + step) % ordered.length];
    if (candidate.id === current.id || taken.has(candidate.id)) continue;
    picked.push(candidate);
    taken.add(candidate.id);
  }
  return picked;
}
