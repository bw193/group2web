import { createHash } from 'node:crypto';

export const PRODUCT_COPY_LOCALES = ['en', 'es', 'pt', 'fr', 'it', 'de', 'he'] as const;
export const LOCALIZED_COPY_LOCALES = ['es', 'pt', 'fr', 'it', 'de', 'he'] as const;

export type ProductCopyLocale = (typeof PRODUCT_COPY_LOCALES)[number];

export type ProductCopyDraftEntry = {
  productId: number;
  locale: ProductCopyLocale;
  fullDescription: string;
};

export type ProductCopyBatchEntry = {
  productId: number;
  locale: ProductCopyLocale;
  expected: {
    modelNumber: string | null;
    translationId: number;
    slug: string;
    nameSha256: string;
    shortDescriptionSha256: string;
    fullDescription: string | null;
    fullDescriptionSha256: string;
  };
  replacement: {
    fullDescription: string;
    fullDescriptionSha256: string;
  };
};

export type ProductCopyReference = {
  productId: 98;
  locale: ProductCopyLocale;
  modelNumber: string | null;
  translationId: number;
  slug: string;
  fullDescription: string | null;
  fullDescriptionSha256: string;
};

export type ProductCopyBatch = {
  schemaVersion: 1;
  batchId: string;
  createdAt: string;
  entries: ProductCopyBatchEntry[];
  references: ProductCopyReference[];
};

export type LiveTranslationRow = {
  productId: number;
  locale: string;
  translationId: number;
  modelNumber: string | null;
  isActive: boolean;
  slug: string;
  name: string;
  shortDescription: string | null;
  fullDescription: string | null;
};

export type ActiveCatalogRow = {
  productId: number;
  locale: string;
  fullDescription: string | null;
};

export type SimilarityMetric = {
  locale: string;
  max: number;
  p95: number;
};

export type BatchQualityReport = {
  targetCount: number;
  clusterMetrics: SimilarityMetric[];
  pair98And99: Array<{ locale: string; score: number }>;
  maxCatalogScore: number;
};

const ALLOWED_TAGS = new Set(['h2', 'h3', 'p', 'ul', 'li', 'strong']);
const LOCALE_INDEX = new Map(PRODUCT_COPY_LOCALES.map((locale, index) => [locale, index]));

export function sha256(value: string | null): string {
  const input = value === null ? '\0NULL' : value;
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function targetKey(productId: number, locale: string): string {
  return `${productId}:${locale}`;
}

export function expectedTargetKeys(): string[] {
  const keys = PRODUCT_COPY_LOCALES.map((locale) => targetKey(99, locale));
  for (let productId = 128; productId <= 147; productId += 1) {
    for (const locale of LOCALIZED_COPY_LOCALES) {
      keys.push(targetKey(productId, locale));
    }
  }
  return keys;
}

export function sortDraftEntries(entries: ProductCopyDraftEntry[]): ProductCopyDraftEntry[] {
  return [...entries].sort((a, b) => {
    if (a.productId !== b.productId) return a.productId - b.productId;
    return (LOCALE_INDEX.get(a.locale) ?? 99) - (LOCALE_INDEX.get(b.locale) ?? 99);
  });
}

function assertPlainObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertLocale(value: unknown, label: string): asserts value is ProductCopyLocale {
  if (typeof value !== 'string' || !(PRODUCT_COPY_LOCALES as readonly string[]).includes(value)) {
    throw new Error(`${label} must be one of ${PRODUCT_COPY_LOCALES.join(', ')}`);
  }
}

export function parseDraftEntries(value: unknown, label = 'draft'): ProductCopyDraftEntry[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((candidate, index) => {
    assertPlainObject(candidate, `${label}[${index}]`);
    const productId = candidate.productId;
    const locale = candidate.locale;
    const fullDescription = candidate.fullDescription;
    if (!Number.isInteger(productId) || (productId as number) <= 0) {
      throw new Error(`${label}[${index}].productId must be a positive integer`);
    }
    assertLocale(locale, `${label}[${index}].locale`);
    if (typeof fullDescription !== 'string' || !fullDescription.trim()) {
      throw new Error(`${label}[${index}].fullDescription must be a non-empty string`);
    }
    return { productId: productId as number, locale, fullDescription };
  });
}

export function parseBatch(value: unknown): ProductCopyBatch {
  assertPlainObject(value, 'batch');
  if (value.schemaVersion !== 1) throw new Error('batch.schemaVersion must be 1');
  if (typeof value.batchId !== 'string' || !value.batchId.trim()) {
    throw new Error('batch.batchId must be a non-empty string');
  }
  if (typeof value.createdAt !== 'string' || Number.isNaN(Date.parse(value.createdAt))) {
    throw new Error('batch.createdAt must be an ISO date string');
  }
  if (!Array.isArray(value.entries)) throw new Error('batch.entries must be an array');
  if (!Array.isArray(value.references)) throw new Error('batch.references must be an array');
  return value as unknown as ProductCopyBatch;
}

export function validateHtml(html: string, label: string): void {
  if (!html.trim()) throw new Error(`${label}: HTML is empty`);
  if (/\p{Extended_Pictographic}/u.test(html)) {
    throw new Error(`${label}: emoji/pictographic characters are not allowed`);
  }
  if (/<p>\s*(?:<strong>\s*<\/strong>\s*)?<\/p>/iu.test(html)) {
    throw new Error(`${label}: empty paragraphs are not allowed`);
  }

  const stack: string[] = [];
  const tags = html.match(/<[^>]*>/g) ?? [];
  for (const token of tags) {
    const match = token.match(/^<(\/)?([a-z0-9]+)>$/i);
    if (!match) throw new Error(`${label}: tag attributes or malformed tag are not allowed: ${token}`);
    const closing = Boolean(match[1]);
    const tag = match[2].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) throw new Error(`${label}: tag <${tag}> is not allowed`);
    if (closing) {
      const opened = stack.pop();
      if (opened !== tag) throw new Error(`${label}: unbalanced closing tag </${tag}>`);
    } else {
      stack.push(tag);
    }
  }
  if (stack.length > 0) throw new Error(`${label}: unclosed tag <${stack.at(-1)}>`);

  const residualAngles = html.replace(/<[^>]*>/g, '');
  if (/[<>]/.test(residualAngles)) throw new Error(`${label}: stray angle bracket found`);
  if (!/<p>/i.test(html)) throw new Error(`${label}: at least one paragraph is required`);
}

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

function shingles(tokens: string[], width: number): Set<string> {
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

function percentile95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

function substantiveParagraphs(html: string, locale: string): string[] {
  const blocks = [...html.matchAll(/<(p|li)>([\s\S]*?)<\/\1>/gi)];
  return blocks
    .map((match) => normalizeText(match[2], locale))
    .filter((paragraph) => paragraph.replace(/\s/g, '').length >= 40);
}

function assertRequiredTechnicalContent(entry: ProductCopyBatchEntry, errors: string[]): void {
  const html = entry.replacement.fullDescription;
  const key = targetKey(entry.productId, entry.locale);
  const requiredByProduct: Record<number, string[]> = {
    99: ['3500', '4000', '6000', 'IP44'],
    130: ['1200', 'CRI', '90'],
    143: ['IP44', 'CRI', '90'],
    144: ['IP66'],
    145: ['35'],
  };
  for (const literal of requiredByProduct[entry.productId] ?? []) {
    if (!html.toLocaleLowerCase(entry.locale).includes(literal.toLocaleLowerCase(entry.locale))) {
      errors.push(`${key}: required technical literal "${literal}" is missing`);
    }
  }

  if (entry.productId === 131 && /203\s*A/i.test(html)) {
    errors.push(`${key}: incorrect model 203A is not allowed`);
  }
  if (entry.productId === 137 && /100\s+0\s*(?:mm)?/i.test(html)) {
    errors.push(`${key}: malformed size "100 0 MM" is not allowed`);
  }
  if ([138, 139, 146].includes(entry.productId) && /\bIP\s*\d+/i.test(html)) {
    errors.push(`${key}: disputed or unsupported IP rating must be omitted`);
  }
  const visibleText = html.replace(/<[^>]*>/g, ' ');
  if ([128, 129, 132, 133].includes(entry.productId) && /\b(?:CE|UL|SAA)\b/i.test(visibleText)) {
    errors.push(`${key}: disputed certification claim must be omitted`);
  }

  if (entry.productId === 99) {
    const forbiddenByLocale: Partial<Record<ProductCopyLocale, RegExp[]>> = {
      en: [/\bcloud/i, /asymmetr/i, /brightness memory/i, /freestand/i, /wall[- ]hang/i, /floor[- ]stand/i],
      es: [/\bnube/i, /asim[eé]tr/i, /memoria de brillo/i, /autoportante/i, /montaje en pared/i, /espejo de pie/i],
      pt: [/\bnuvem/i, /assim[eé]tr/i, /mem[oó]ria de brilho/i, /autoportante/i, /montagem na parede/i, /espelho de ch[aã]o/i],
      fr: [/\bnuage/i, /asym[eé]tr/i, /m[eé]moire de luminosit/i, /autoportant/i, /fixation murale/i, /miroir sur pied/i],
      it: [/\bnuvola/i, /asimmetr/i, /memoria della luminosit/i, /autoportante/i, /montaggio a parete/i, /specchio da terra/i],
      de: [/\bwolke/i, /asymmetr/i, /helligkeitsspeicher/i, /freistehend/i, /wandmontage/i, /standspiegel/i],
      he: [/ענן/u, /אסימטר/u, /זיכרון בהירות/u, /עומדת/u, /תלייה על הקיר/u],
    };
    for (const pattern of forbiddenByLocale[entry.locale] ?? []) {
      if (pattern.test(html)) errors.push(`${key}: forbidden product-98 or installation wording matched ${pattern}`);
    }
  }
}

export function validateBatchStatic(batch: ProductCopyBatch): void {
  const errors: string[] = [];
  const requiredKeys = expectedTargetKeys();
  const requiredKeySet = new Set(requiredKeys);
  const seen = new Set<string>();

  if (batch.entries.length !== requiredKeys.length) {
    errors.push(`batch must contain exactly ${requiredKeys.length} entries; received ${batch.entries.length}`);
  }

  for (const entry of batch.entries) {
    const key = targetKey(entry.productId, entry.locale);
    if (seen.has(key)) errors.push(`${key}: duplicate batch entry`);
    seen.add(key);
    if (!requiredKeySet.has(key)) errors.push(`${key}: unexpected target`);
    if (!Number.isInteger(entry.expected?.translationId)) errors.push(`${key}: invalid expected translationId`);
    if (typeof entry.expected?.slug !== 'string' || !entry.expected.slug) errors.push(`${key}: invalid expected slug`);
    if (typeof entry.replacement?.fullDescription !== 'string') errors.push(`${key}: replacement is missing`);
    if (sha256(entry.expected?.fullDescription ?? null) !== entry.expected?.fullDescriptionSha256) {
      errors.push(`${key}: before fullDescription hash does not match its value`);
    }
    if (sha256(entry.replacement?.fullDescription ?? null) !== entry.replacement?.fullDescriptionSha256) {
      errors.push(`${key}: replacement fullDescription hash does not match its value`);
    }
    try {
      validateHtml(entry.replacement.fullDescription, key);
    } catch (error) {
      errors.push((error as Error).message);
    }
    assertRequiredTechnicalContent(entry, errors);
  }
  for (const key of requiredKeys) if (!seen.has(key)) errors.push(`${key}: target is missing`);

  const referenceKeys = new Set<string>();
  for (const reference of batch.references) {
    const key = targetKey(reference.productId, reference.locale);
    referenceKeys.add(key);
    if (reference.productId !== 98) errors.push(`${key}: only product 98 may be a reference`);
    if (sha256(reference.fullDescription) !== reference.fullDescriptionSha256) {
      errors.push(`${key}: reference hash does not match its value`);
    }
  }
  for (const locale of PRODUCT_COPY_LOCALES) {
    const key = targetKey(98, locale);
    if (!referenceKeys.has(key)) errors.push(`${key}: product 98 reference is missing`);
  }
  if (batch.references.length !== PRODUCT_COPY_LOCALES.length) {
    errors.push(`batch must contain exactly ${PRODUCT_COPY_LOCALES.length} product 98 references`);
  }

  if (errors.length > 0) throw new Error(`Product-copy batch validation failed:\n- ${errors.join('\n- ')}`);
}

export function validateLiveRows(
  batch: ProductCopyBatch,
  liveRows: LiveTranslationRow[],
  direction: 'forward' | 'rollback',
): void {
  const errors: string[] = [];
  const byKey = new Map(liveRows.map((row) => [targetKey(row.productId, row.locale), row]));
  if (liveRows.length !== batch.entries.length) {
    errors.push(`locked row count ${liveRows.length} does not match batch entry count ${batch.entries.length}`);
  }
  for (const entry of batch.entries) {
    const key = targetKey(entry.productId, entry.locale);
    const live = byKey.get(key);
    if (!live) {
      errors.push(`${key}: live row is missing`);
      continue;
    }
    if (!live.isActive) errors.push(`${key}: product is inactive`);
    if (live.translationId !== entry.expected.translationId) errors.push(`${key}: translation ID changed`);
    if (live.modelNumber !== entry.expected.modelNumber) errors.push(`${key}: model number changed`);
    if (live.slug !== entry.expected.slug) errors.push(`${key}: slug changed`);
    if (sha256(live.name) !== entry.expected.nameSha256) errors.push(`${key}: name changed`);
    if (sha256(live.shortDescription) !== entry.expected.shortDescriptionSha256) {
      errors.push(`${key}: short description changed`);
    }
    const expectedHash = direction === 'forward'
      ? entry.expected.fullDescriptionSha256
      : entry.replacement.fullDescriptionSha256;
    if (sha256(live.fullDescription) !== expectedHash) {
      errors.push(`${key}: current full description does not match the ${direction} precondition`);
    }
  }
  if (errors.length > 0) throw new Error(`Live-row precondition failed:\n- ${errors.join('\n- ')}`);
}

export function validateReferenceRows(batch: ProductCopyBatch, liveRows: LiveTranslationRow[]): void {
  const byKey = new Map(liveRows.map((row) => [targetKey(row.productId, row.locale), row]));
  const errors: string[] = [];
  for (const reference of batch.references) {
    const key = targetKey(reference.productId, reference.locale);
    const live = byKey.get(key);
    if (!live) {
      errors.push(`${key}: live reference row is missing`);
      continue;
    }
    if (live.translationId !== reference.translationId) errors.push(`${key}: reference translation ID changed`);
    if (live.modelNumber !== reference.modelNumber) errors.push(`${key}: reference model changed`);
    if (live.slug !== reference.slug) errors.push(`${key}: reference slug changed`);
    if (sha256(live.fullDescription) !== reference.fullDescriptionSha256) {
      errors.push(`${key}: reference full description changed`);
    }
  }
  if (errors.length > 0) throw new Error(`Product 98 reference validation failed:\n- ${errors.join('\n- ')}`);
}

export function validateBatchSimilarity(
  batch: ProductCopyBatch,
  activeCatalog: ActiveCatalogRow[] = [],
): BatchQualityReport {
  validateBatchStatic(batch);
  const errors: string[] = [];
  const clusterMetrics: SimilarityMetric[] = [];
  const pair98And99: Array<{ locale: string; score: number }> = [];

  for (const locale of LOCALIZED_COPY_LOCALES) {
    const cluster = batch.entries.filter(
      (entry) => entry.locale === locale && entry.productId >= 128 && entry.productId <= 147,
    );
    const values: number[] = [];
    for (let left = 0; left < cluster.length; left += 1) {
      for (let right = left + 1; right < cluster.length; right += 1) {
        values.push(shingleJaccard(
          cluster[left].replacement.fullDescription,
          cluster[right].replacement.fullDescription,
          locale,
        ));
      }
    }
    const max = values.length > 0 ? Math.max(...values) : 0;
    const p95 = percentile95(values);
    clusterMetrics.push({ locale, max, p95 });
    if (max > 0.45) errors.push(`${locale}: 128-147 maximum similarity ${max.toFixed(3)} exceeds 0.45`);
    if (p95 > 0.30) errors.push(`${locale}: 128-147 P95 similarity ${p95.toFixed(3)} exceeds 0.30`);
  }

  for (const locale of PRODUCT_COPY_LOCALES) {
    const product99 = batch.entries.find((entry) => entry.productId === 99 && entry.locale === locale);
    const product98 = batch.references.find((entry) => entry.locale === locale);
    if (!product99 || !product98?.fullDescription) continue;
    const score = shingleJaccard(product98.fullDescription, product99.replacement.fullDescription, locale);
    pair98And99.push({ locale, score });
    if (score > 0.35) errors.push(`${locale}: product 98/99 similarity ${score.toFixed(3)} exceeds 0.35`);
  }

  const paragraphOwner = new Map<string, string>();
  for (const entry of batch.entries) {
    const key = targetKey(entry.productId, entry.locale);
    for (const paragraph of substantiveParagraphs(entry.replacement.fullDescription, entry.locale)) {
      const paragraphKey = `${entry.locale}:${paragraph}`;
      const previous = paragraphOwner.get(paragraphKey);
      if (previous && previous !== key) errors.push(`${key}: repeats a substantive paragraph from ${previous}`);
      paragraphOwner.set(paragraphKey, key);
    }
  }

  let maxCatalogScore = 0;
  if (activeCatalog.length > 0) {
    const effectiveCatalog = new Map<string, ActiveCatalogRow>();
    for (const row of activeCatalog) effectiveCatalog.set(targetKey(row.productId, row.locale), row);
    for (const entry of batch.entries) {
      effectiveCatalog.set(targetKey(entry.productId, entry.locale), {
        productId: entry.productId,
        locale: entry.locale,
        fullDescription: entry.replacement.fullDescription,
      });
    }

    for (const entry of batch.entries) {
      const key = targetKey(entry.productId, entry.locale);
      const normalized = normalizeText(entry.replacement.fullDescription, entry.locale);
      for (const other of effectiveCatalog.values()) {
        if (other.locale !== entry.locale || other.productId === entry.productId || !other.fullDescription) continue;
        const otherKey = targetKey(other.productId, other.locale);
        const otherNormalized = normalizeText(other.fullDescription, entry.locale);
        if (normalized === otherNormalized) errors.push(`${key}: exact duplicate of active catalog row ${otherKey}`);
        const score = shingleJaccard(entry.replacement.fullDescription, other.fullDescription, entry.locale);
        maxCatalogScore = Math.max(maxCatalogScore, score);
        if (score > 0.55) errors.push(`${key}: similarity ${score.toFixed(3)} with ${otherKey} exceeds 0.55`);
      }
    }
  }

  if (errors.length > 0) throw new Error(`Product-copy quality gate failed:\n- ${errors.join('\n- ')}`);
  return { targetCount: batch.entries.length, clusterMetrics, pair98And99, maxCatalogScore };
}
