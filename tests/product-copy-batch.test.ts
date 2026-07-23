import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PRODUCT_COPY_LOCALES,
  expectedTargetKeys,
  parseBatch,
  parseDraftEntries,
  sha256,
  shingleJaccard,
  validateBatchStatic,
  validateBatchSimilarity,
  validateHtml,
  validateLiveRows,
  type LiveTranslationRow,
  type ProductCopyBatch,
  type ProductCopyBatchEntry,
  type ProductCopyLocale,
} from '../scripts/product-copy-batch-lib';

function test(name: string, fn: () => void) {
  fn();
  console.log(`ok - ${name}`);
}

function replacementFor(productId: number, locale: string): string {
  const required = productId === 99
    ? '3500 K, 4000 K, 6000 K, IP44, 60 × 165 cm, 65 × 170 cm and 80 × 180 cm'
    : productId === 130
      ? '1200 mm and CRI &gt; 90'
      : productId === 143
        ? 'IP44 and CRI &gt; 90'
        : productId === 144
          ? 'IP66'
          : productId === 145
            ? '35 mm'
            : 'distinct verified construction';
  return `<p>Product ${productId} locale ${locale} uses ${required} in a deliberately unique description.</p>`;
}

function makeEntry(productId: number, locale: ProductCopyLocale): ProductCopyBatchEntry {
  const before = `<p>Previous content for ${productId} in ${locale}.</p>`;
  const replacement = replacementFor(productId, locale);
  return {
    productId,
    locale,
    expected: {
      modelNumber: `CTL${productId}`,
      translationId: productId * 10 + PRODUCT_COPY_LOCALES.indexOf(locale),
      slug: `product-${productId}`,
      nameSha256: sha256(`Product ${productId}`),
      shortDescriptionSha256: sha256(`Short ${productId}`),
      fullDescription: before,
      fullDescriptionSha256: sha256(before),
    },
    replacement: {
      fullDescription: replacement,
      fullDescriptionSha256: sha256(replacement),
    },
  };
}

function makeBatch(): ProductCopyBatch {
  const entries = expectedTargetKeys().map((key) => {
    const [productId, locale] = key.split(':');
    return makeEntry(Number(productId), locale as ProductCopyLocale);
  });
  return {
    schemaVersion: 1,
    batchId: 'test-batch',
    createdAt: '2026-07-23T00:00:00.000Z',
    entries,
    references: PRODUCT_COPY_LOCALES.map((locale, index) => {
      const fullDescription = `<p>Reference 98 ${locale}.</p>`;
      return {
        productId: 98 as const,
        locale,
        modelNumber: 'CTL1017',
        translationId: 980 + index,
        slug: 'product-98',
        fullDescription,
        fullDescriptionSha256: sha256(fullDescription),
      };
    }),
  };
}

function liveRowsFor(batch: ProductCopyBatch, replacement = false): LiveTranslationRow[] {
  return batch.entries.map((entry) => ({
    productId: entry.productId,
    locale: entry.locale,
    translationId: entry.expected.translationId,
    modelNumber: entry.expected.modelNumber,
    isActive: true,
    slug: entry.expected.slug,
    name: `Product ${entry.productId}`,
    shortDescription: `Short ${entry.productId}`,
    fullDescription: replacement
      ? entry.replacement.fullDescription
      : entry.expected.fullDescription,
  }));
}

test('product-copy target set contains exactly 127 rows', () => {
  assert.equal(expectedTargetKeys().length, 127);
  assert.equal(new Set(expectedTargetKeys()).size, 127);
});

test('product-copy batch validates hashes, references, HTML, and exact target set', () => {
  assert.doesNotThrow(() => validateBatchStatic(makeBatch()));
});

test('versioned 2026-07-23 batch passes static and similarity quality gates', () => {
  const batchPath = resolve('content/product-copy/2026-07-23-distinct-products.json');
  const batch = parseBatch(JSON.parse(readFileSync(batchPath, 'utf8')) as unknown);
  const report = validateBatchSimilarity(batch);
  assert.equal(report.targetCount, 127);
  assert.ok(report.clusterMetrics.every((metric) => metric.max <= 0.45 && metric.p95 <= 0.30));
  assert.ok(report.pair98And99.every((metric) => metric.score <= 0.35));
});

test('draft parser rejects empty copy', () => {
  assert.throws(
    () => parseDraftEntries([{ productId: 99, locale: 'en', fullDescription: '' }]),
    /non-empty string/,
  );
});

test('HTML validation rejects attributes, empty paragraphs, and emoji', () => {
  assert.throws(() => validateHtml('<p class="copy">Text</p>', 'attributes'), /attributes/);
  assert.throws(() => validateHtml('<p><strong></strong></p>', 'empty'), /empty paragraphs/);
  assert.throws(() => validateHtml('<p>Mirror ✨</p>', 'emoji'), /emoji/);
});

test('three-word shingle Jaccard distinguishes identical and unrelated copy', () => {
  assert.equal(shingleJaccard('<p>one two three four</p>', '<p>one two three four</p>'), 1);
  assert.equal(shingleJaccard('<p>one two three four</p>', '<p>five six seven eight</p>'), 0);
});

test('forward live-row validation rejects a changed current description before writing', () => {
  const batch = makeBatch();
  const liveRows = liveRowsFor(batch);
  liveRows[0] = { ...liveRows[0], fullDescription: '<p>Concurrent CMS edit.</p>' };
  assert.throws(() => validateLiveRows(batch, liveRows, 'forward'), /current full description/);
});

test('live-row validation rejects missing rows so a batch cannot partially apply', () => {
  const batch = makeBatch();
  assert.throws(
    () => validateLiveRows(batch, liveRowsFor(batch).slice(1), 'forward'),
    /locked row count|live row is missing/,
  );
});

test('rollback requires every row to still match the applied replacement', () => {
  const batch = makeBatch();
  assert.doesNotThrow(() => validateLiveRows(batch, liveRowsFor(batch, true), 'rollback'));
  const rows = liveRowsFor(batch, true);
  rows[10] = { ...rows[10], slug: 'changed-slug' };
  assert.throws(() => validateLiveRows(batch, rows, 'rollback'), /slug changed/);
});
