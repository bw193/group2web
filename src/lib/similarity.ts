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
};

export type PreparedProductText = {
  name: Set<string>;
  short: Set<string>;
  full: Set<string>;
};

export type ProductSimilarityScores = {
  nameScore: number;
  shortScore: number;
  fullScore: number;
  overall: number;
};

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

/** Tokenize/shingle each field once so pairwise comparisons only intersect sets. */
export function prepareProductText(fields: ProductTextFields, locale = 'en'): PreparedProductText {
  return {
    name: shingles(wordTokens(fields.name ?? '', locale), NAME_SHINGLE_WIDTH),
    short: shingles(wordTokens(fields.shortDescription ?? '', locale), DESCRIPTION_SHINGLE_WIDTH),
    full: shingles(wordTokens(fields.fullDescription ?? '', locale), DESCRIPTION_SHINGLE_WIDTH),
  };
}

export function compareProductTexts(a: PreparedProductText, b: PreparedProductText): ProductSimilarityScores {
  const nameScore = jaccardOfSets(a.name, b.name);
  const shortScore = jaccardOfSets(a.short, b.short);
  const fullScore = jaccardOfSets(a.full, b.full);
  return { nameScore, shortScore, fullScore, overall: Math.max(nameScore, shortScore, fullScore) };
}
