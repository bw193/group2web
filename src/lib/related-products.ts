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
 * Similarity alone made the block repetitive. Closeness goes both ways, so 47%
 * of the cards pointed back at the page linking to them, and after a click the
 * next page repeated a card the visitor had just seen two times in three
 * (measured on the live catalog, October 2026). So the cards of a whole
 * category are chosen together, each product taking the nearest products
 * these three rules allow:
 *
 * - **No way back.** A page never links to a product whose page links to it.
 * - **Nothing twice in a row.** Every card leads to a page whose cards are all
 *   new to the visitor: neither the page they came from nor its other cards.
 * - **No hubs.** No product is on more than one sibling page above the
 *   average (four, with three cards).
 *
 * Ranking by similarity alone also left 15 of 163 products with no inbound
 * link at all: a product can be nobody's nearest neighbour, and those are
 * exactly the pages F-04 is about. So once the cards are dealt, any such
 * product replaces a spare card on its nearest neighbour's page, and every
 * product is linked from at least one sibling. A rule gives way only for a
 * product left with no card that keeps it — hubs first, then repeats, then
 * the way back — as in a category of four, where three cards each cannot
 * avoid linking back.
 *
 * The price: two products that are each other's nearest match share one link
 * rather than two, so one of the pair shows its second-nearest instead.
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

/** Prepares products for scoring, indexing `locale`'s text and spec rows once. */
function preparer(
  translations: readonly RelatedTextRow[],
  specs: readonly RelatedSpecRow[],
  locale: string,
): (product: RelatedProductRow) => Prepared {
  const textById = new Map<number, RelatedTextRow>();
  for (const t of translations) {
    if (t.locale === locale && !textById.has(t.productId)) textById.set(t.productId, t);
  }
  const specLines = new Map<number, string[]>();
  for (const s of specs) {
    if (s.locale !== locale) continue;
    if (!specLines.has(s.productId)) specLines.set(s.productId, []);
    specLines.get(s.productId)!.push(`${s.specKey} ${s.specValue}`);
  }
  return (product) => {
    const text = textById.get(product.id);
    const specText = (specLines.get(product.id) ?? []).join('. ');
    return {
      name: shingles(wordTokens(text?.name ?? '', locale), NAME_SHINGLE_WIDTH),
      specs: shingles(wordTokens(specText, locale), NAME_SHINGLE_WIDTH),
      short: shingles(wordTokens(text?.shortDescription ?? '', locale), DESCRIPTION_SHINGLE_WIDTH),
      tags: new Set(parseTags(product.tags).map((tag) => tag.toLowerCase())),
      series: seriesKey(product.modelNumber),
    };
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
};

/** The active products of `current`'s category, in catalog order. */
function categoryOf<T extends RelatedProductRow>(current: RelatedProductRow, products: readonly T[]): T[] {
  if (current.categoryId === null) return [];
  return orderCategoryProducts(products.filter((p) => p.isActive && p.categoryId === current.categoryId));
}

/** Relatedness between any two of `rows`, computed once per pair. */
function pairScores(
  rows: readonly RelatedProductRow[],
  prepare: (product: RelatedProductRow) => Prepared,
): (a: number, b: number) => number {
  const prepared = rows.map(prepare);
  const scores = new Map<number, Map<number, number>>(rows.map((p) => [p.id, new Map()]));
  rows.forEach((a, i) => {
    for (let j = i + 1; j < rows.length; j += 1) {
      const score = relatednessScore(prepared[i], prepared[j]);
      scores.get(a.id)!.set(rows[j].id, score);
      scores.get(rows[j].id)!.set(a.id, score);
    }
  });
  return (a, b) => scores.get(a)?.get(b) ?? 0;
}

/**
 * The cards of every product in one category, by product id: the rules in the
 * module comment. `rows` is the category in catalog order.
 */
function linkCategory(
  rows: readonly RelatedProductRow[],
  score: (a: number, b: number) => number,
  count: number,
): Map<number, number[]> {
  const order = new Map(rows.map((p, index) => [p.id, index]));
  const byOrder = (a: number, b: number) => order.get(a)! - order.get(b)!;
  const ids = rows.map((p) => p.id);
  const out = new Map(ids.map((id) => [id, new Set<number>()]));
  const inbound = new Map(ids.map((id) => [id, new Set<number>()]));
  const slots = Math.min(count, ids.length - 1);
  const maxInbound = count + 1;

  // Whether u -> v would show a visitor a card they saw one click ago.
  const repeats = (u: number, v: number) => {
    // x shows u and v: from x, u's page repeats v.
    for (const x of inbound.get(u)!) if (out.get(x)!.has(v)) return true;
    // u shows v and y, and v shows y: v's page repeats y.
    for (const y of out.get(u)!) if (out.get(v)!.has(y)) return true;
    // u shows w and v, and w shows v: w's page repeats v.
    for (const w of out.get(u)!) if (out.get(w)!.has(v)) return true;
    return false;
  };
  // `relax` drops the rules one at a time, for a product left with no card
  // that keeps them all.
  const allows = (u: number, v: number, relax: number) =>
    u !== v &&
    out.get(u)!.size < slots &&
    !out.get(u)!.has(v) &&
    (relax >= 1 || inbound.get(v)!.size < maxInbound) &&
    (relax >= 2 || !repeats(u, v)) &&
    (relax >= 3 || !out.get(v)!.has(u));
  const allowedFor = (u: number, relax: number) =>
    ids.filter((v) => allows(u, v, relax)).sort((a, b) => score(u, b) - score(u, a) || byOrder(a, b));
  const link = (u: number, v: number) => {
    out.get(u)!.add(v);
    inbound.get(v)!.add(u);
  };
  const unlink = (u: number, v: number) => {
    out.get(u)!.delete(v);
    inbound.get(v)!.delete(u);
  };

  // Round by round, every product gets one more card. The products with the
  // fewest cards left to choose from pick first, each taking the nearest
  // product the rules allow.
  for (let relax = 0; relax <= 3; relax += 1) {
    for (let round = 0; round < slots; round += 1) {
      const waiting = ids.filter((id) => out.get(id)!.size <= round && out.get(id)!.size < slots);
      const choices = new Map(waiting.map((id) => [id, allowedFor(id, relax).length]));
      waiting.sort((a, b) => choices.get(a)! - choices.get(b)! || byOrder(a, b));
      for (const id of waiting) {
        const [nearest] = allowedFor(id, relax);
        if (nearest !== undefined) link(id, nearest);
      }
    }
  }

  // Then a product nobody links to takes the place of the weakest card on its
  // nearest neighbour's page that can spare one: a card whose product is
  // linked from another page too. The weakest-matched products go first.
  const nearestScore = new Map(ids.map((id) => [id, Math.max(...ids.filter((o) => o !== id).map((o) => score(id, o)))]));
  const loneliestFirst = [...ids].sort((a, b) => nearestScore.get(a)! - nearestScore.get(b)! || byOrder(a, b));
  for (let relax = 0; relax <= 3; relax += 1) {
    for (const target of loneliestFirst) {
      if (inbound.get(target)!.size > 0) continue;
      const neighbours = ids.filter((id) => id !== target).sort((a, b) => score(b, target) - score(a, target) || byOrder(a, b));
      search: for (const from of neighbours) {
        if (allows(from, target, relax)) {
          link(from, target);
          break;
        }
        const spare = [...out.get(from)!]
          .filter((card) => inbound.get(card)!.size >= 2)
          .sort((a, b) => score(from, a) - score(from, b) || byOrder(b, a));
        for (const card of spare) {
          unlink(from, card);
          if (allows(from, target, relax)) {
            link(from, target);
            break search;
          }
          link(from, card);
        }
      }
    }
  }

  return new Map(ids.map((id) => [id, [...out.get(id)!].sort((a, b) => score(id, b) - score(id, a) || byOrder(a, b))]));
}

// Every page of a category shows its part of the same graph, and the public-data
// snapshot hands every render the same row arrays, so a category's graph is
// built once per server process rather than once per page.
type CachedLinks = { translations: readonly RelatedTextRow[]; specs: readonly RelatedSpecRow[]; links: Map<number, number[]> };
const linkCache = new WeakMap<readonly RelatedProductRow[], Map<string, CachedLinks>>();

function categoryLinks(
  category: readonly RelatedProductRow[],
  products: readonly RelatedProductRow[],
  translations: readonly RelatedTextRow[],
  specs: readonly RelatedSpecRow[],
  locale: string,
  count: number,
): Map<number, number[]> {
  if (!linkCache.has(products)) linkCache.set(products, new Map());
  const byKey = linkCache.get(products)!;
  const key = `${category[0].categoryId}:${locale}:${count}`;
  const cached = byKey.get(key);
  if (cached && cached.translations === translations && cached.specs === specs) return cached.links;

  const links = linkCategory(category, pairScores(category, preparer(translations, specs, locale)), count);
  byKey.set(key, { translations, specs, links });
  return links;
}

/** Every sibling of `current` in its category, most similar first. */
export function rankRelatedProducts<T extends RelatedProductRow>(
  current: RelatedProductRow,
  products: readonly T[],
  translations: readonly RelatedTextRow[],
  specs: readonly RelatedSpecRow[],
  locale: string = defaultLocale,
): T[] {
  const siblings = categoryOf(current, products).filter((p) => p.id !== current.id);
  const prepare = preparer(translations, specs, locale);
  const self = prepare(current);
  return siblings
    .map((product, index) => ({ product, index, score: relatednessScore(self, prepare(product)) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.product);
}

export function pickRelatedProducts<T extends RelatedProductRow>(
  current: RelatedProductRow,
  products: readonly T[],
  translations: readonly RelatedTextRow[],
  specs: readonly RelatedSpecRow[],
  options: PickRelatedOptions = {},
): T[] {
  const { count = RELATED_PRODUCT_COUNT, locale = defaultLocale } = options;
  if (count <= 0) return [];
  const category = categoryOf(current, products);
  // A product outside its own active category (an inactive one) is in nobody's
  // graph, so it simply shows its nearest siblings.
  if (!category.some((p) => p.id === current.id)) {
    return rankRelatedProducts(current, products, translations, specs, locale).slice(0, count);
  }

  const links = categoryLinks(category, products, translations, specs, locale, count);
  const byId = new Map(category.map((p) => [p.id, p]));
  return (links.get(current.id) ?? []).map((id) => byId.get(id)!);
}
