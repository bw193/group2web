// Pure lexical-similarity helpers shared by the CMS product similarity API
// and the offline product-copy quality gates (scripts/product-copy-batch-lib.ts).
// Keep this module dependency-free so both Next.js routes and tsx scripts can use it.

export function normalizeText(html: string, locale = 'en'): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi, ' ')
    .normalize('NFKC')
    .toLocaleLowerCase(locale)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function wordTokens(html: string, locale = 'en'): string[] {
  const normalized = normalizeText(html, locale);
  if (!normalized) return [];
  const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
  const segmented = [...segmenter.segment(normalized)]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment);
  return segmented.length > 0 ? segmented : normalized.split(' ');
}

export function shingles(tokens: string[], width: number): Set<string> {
  const result = new Set<string>();
  if (tokens.length < width) {
    if (tokens.length > 0) result.add(tokens.join(' '));
    return result;
  }
  for (let index = 0; index <= tokens.length - width; index += 1) {
    result.add(tokens.slice(index, index + width).join(' '));
  }
  return result;
}

export function shingleJaccard(left: string, right: string, locale = 'en', width = 3): number {
  const a = shingles(wordTokens(left, locale), width);
  const b = shingles(wordTokens(right, locale), width);
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Product-level comparison (name + shortDescription + fullDescription)
// ---------------------------------------------------------------------------

/** Names are short (3-6 words), so bag-of-words overlap is the useful signal. */
export const NAME_SHINGLE_WIDTH = 1;
/** Descriptions use 3-word shingles, matching the offline quality gates. */
export const DESCRIPTION_SHINGLE_WIDTH = 3;

export type ProductTextFields = {
  name: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  /** Spec rows joined to text ("Size 600x800mm. IP Rating IP44"), part of the page's main content. */
  specifications?: string | null;
};

export type PreparedProductText = {
  name: Set<string>;
  short: Set<string>;
  full: Set<string>;
  /** Shingles of the combined main content: name + short + full + specs. */
  content: Set<string>;
  /** Token count of the combined main content, used to spot thin pages. */
  contentTokens: number;
};

export type ProductSimilarityScores = {
  nameScore: number;
  shortScore: number;
  fullScore: number;
  /** Containment of the combined main content - closest to Google's whole-page dedup. */
  contentScore: number;
  overall: number;
};

export type ProductComparison = ProductSimilarityScores & {
  /** True when both pages carry so little unique text that shared template dominates. */
  thin: boolean;
};

/** Below this many main-content tokens a product page is mostly boilerplate to Google. */
export const THIN_CONTENT_TOKENS = 60;

/**
 * Unlike shingleJaccard (where two empty texts count as identical), an empty
 * side scores 0 here: a field both products left blank is no duplicate signal.
 */
export function jaccardOfSets(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Containment (overlap coefficient): intersection over the smaller set.
 * Google clusters a page whose content is a subset of another page as a
 * duplicate even when the length difference keeps Jaccard low, so this is the
 * better whole-page dedup proxy.
 */
export function overlapCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / Math.min(a.size, b.size);
}

/** Tokenize/shingle each field once so pairwise comparisons only intersect sets. */
export function prepareProductText(fields: ProductTextFields, locale = 'en'): PreparedProductText {
  const combined = [fields.name, fields.shortDescription, fields.fullDescription, fields.specifications]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join('. ');
  const contentTokens = wordTokens(combined, locale);
  return {
    name: shingles(wordTokens(fields.name ?? '', locale), NAME_SHINGLE_WIDTH),
    short: shingles(wordTokens(fields.shortDescription ?? '', locale), DESCRIPTION_SHINGLE_WIDTH),
    full: shingles(wordTokens(fields.fullDescription ?? '', locale), DESCRIPTION_SHINGLE_WIDTH),
    content: shingles(contentTokens, DESCRIPTION_SHINGLE_WIDTH),
    contentTokens: contentTokens.length,
  };
}

export function compareProductTexts(a: PreparedProductText, b: PreparedProductText): ProductComparison {
  const nameScore = jaccardOfSets(a.name, b.name);
  const shortScore = jaccardOfSets(a.short, b.short);
  const fullScore = jaccardOfSets(a.full, b.full);
  const contentScore = overlapCoefficient(a.content, b.content);
  return {
    nameScore,
    shortScore,
    fullScore,
    contentScore,
    overall: Math.max(nameScore, shortScore, fullScore),
    thin: a.contentTokens < THIN_CONTENT_TOKENS && b.contentTokens < THIN_CONTENT_TOKENS,
  };
}

// ---------------------------------------------------------------------------
// Google-aligned SEO risk grading
// ---------------------------------------------------------------------------

export type SeoRiskLevel = 'duplicate' | 'high' | 'moderate' | 'none';

export type SeoRisk = {
  /** Strongest duplication signal across whole-page content and per-field overlap. */
  level: SeoRiskLevel;
  /** Near-identical product names: Google expects a unique, descriptive title per page. */
  titleRisk: boolean;
  /** Near-identical short descriptions, the meta-description source for product pages. */
  metaRisk: boolean;
  /** Both pages are mostly boilerplate to Google (too little unique text). */
  thinRisk: boolean;
};

const LEVEL_ORDER: SeoRiskLevel[] = ['none', 'moderate', 'high', 'duplicate'];

function strongest(...levels: SeoRiskLevel[]): SeoRiskLevel {
  return levels.reduce((worst, level) =>
    LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(worst) ? level : worst,
  );
}

/**
 * Grades a product pair against Google's duplicate-content guidance
 * (developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls):
 * Google does not penalize duplicates, it canonicalizes - of near-identical
 * pages only one is indexed and the rest are filtered from results - and every
 * page should carry a unique title and meta description. Grading takes the
 * strongest of two signals: containment of the combined main content
 * (name + short + full + specs, Google's whole-page view) and overlap of the
 * full description alone. Two thin pages are lifted to at least moderate
 * because the shared page template dominates what Google renders.
 */
export function assessSeoRisk(cmp: ProductComparison): SeoRisk {
  const contentLevel: SeoRiskLevel =
    cmp.contentScore >= 0.9 ? 'duplicate'
    : cmp.contentScore >= 0.7 ? 'high'
    : cmp.contentScore >= 0.5 ? 'moderate'
    : 'none';
  const fieldLevel: SeoRiskLevel =
    cmp.fullScore >= 0.85 ? 'duplicate'
    : cmp.fullScore >= 0.55 ? 'high'
    : cmp.fullScore >= 0.35 || cmp.shortScore >= 0.7 ? 'moderate'
    : 'none';
  const thinLevel: SeoRiskLevel = cmp.thin ? 'moderate' : 'none';
  return {
    level: strongest(contentLevel, fieldLevel, thinLevel),
    titleRisk: cmp.nameScore >= 0.9,
    metaRisk: cmp.shortScore >= 0.7,
    thinRisk: cmp.thin,
  };
}
