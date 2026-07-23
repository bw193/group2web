import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import postgres from 'postgres';
import {
  PRODUCT_COPY_LOCALES,
  parseBatch,
  validateBatchSimilarity,
  validateBatchStatic,
  validateLiveRows,
  validateReferenceRows,
  type ActiveCatalogRow,
  type LiveTranslationRow,
  type ProductCopyBatch,
} from './product-copy-batch-lib';

loadEnvConfig(process.cwd());

type QuerySql = postgres.Sql | postgres.TransactionSql;
type Mode = 'dry-run' | 'apply' | 'rollback';

type SpecRow = {
  id: number;
  productId: number;
  locale: string;
  specKey: string;
  specValue: string;
};

type ImageRow = {
  id: number;
  productId: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
};

type ProductTimestampRow = {
  id: number;
  updatedAt: string;
};

type AncillarySnapshot = {
  specs: SpecRow[];
  images: ImageRow[];
};

function usage(): never {
  throw new Error(
    'Usage: npx tsx scripts/apply-product-copy.ts --batch <batch.json> [--apply | --rollback]',
  );
}

function parseArgs(argv: string[]): { batchPath: string; mode: Mode } {
  const batchIndex = argv.indexOf('--batch');
  if (batchIndex < 0 || !argv[batchIndex + 1]) usage();
  const apply = argv.includes('--apply');
  const rollback = argv.includes('--rollback');
  if (apply && rollback) throw new Error('--apply and --rollback are mutually exclusive');
  return {
    batchPath: resolve(argv[batchIndex + 1]),
    mode: rollback ? 'rollback' : apply ? 'apply' : 'dry-run',
  };
}

function valuesCte(
  entries: Array<{ productId: number; locale: string }>,
): { sql: string; parameters: Array<number | string> } {
  const parameters: Array<number | string> = [];
  const tuples = entries.map((entry, index) => {
    const offset = index * 2;
    parameters.push(entry.productId, entry.locale);
    return `($${offset + 1}::integer, $${offset + 2}::text)`;
  });
  return { sql: tuples.join(', '), parameters };
}

async function queryTargetRows(
  sql: QuerySql,
  batch: ProductCopyBatch,
  lock = false,
): Promise<LiveTranslationRow[]> {
  const targets = valuesCte(batch.entries);
  const query = `
    with targets(product_id, locale) as (values ${targets.sql})
    select
      pt.product_id as "productId",
      pt.locale,
      pt.id as "translationId",
      p.model_number as "modelNumber",
      p.is_active as "isActive",
      pt.slug,
      pt.name,
      pt.short_description as "shortDescription",
      pt.full_description as "fullDescription"
    from targets t
    join product_translations pt
      on pt.product_id = t.product_id and pt.locale = t.locale
    join products p on p.id = pt.product_id
    order by pt.product_id, pt.locale
    ${lock ? 'for update of p, pt' : ''}
  `;
  return await sql.unsafe<LiveTranslationRow[]>(query, targets.parameters);
}

async function queryReferenceRows(sql: QuerySql, lock = false): Promise<LiveTranslationRow[]> {
  const placeholders = PRODUCT_COPY_LOCALES.map((_, index) => `$${index + 1}::text`).join(', ');
  return await sql.unsafe<LiveTranslationRow[]>(
    `
      select
        pt.product_id as "productId",
        pt.locale,
        pt.id as "translationId",
        p.model_number as "modelNumber",
        p.is_active as "isActive",
        pt.slug,
        pt.name,
        pt.short_description as "shortDescription",
        pt.full_description as "fullDescription"
      from product_translations pt
      join products p on p.id = pt.product_id
      where pt.product_id = 98 and pt.locale in (${placeholders})
      order by pt.locale
      ${lock ? 'for update of p, pt' : ''}
    `,
    [...PRODUCT_COPY_LOCALES],
  );
}

async function queryActiveCatalog(sql: QuerySql): Promise<ActiveCatalogRow[]> {
  const placeholders = PRODUCT_COPY_LOCALES.map((_, index) => `$${index + 1}::text`).join(', ');
  return await sql.unsafe<ActiveCatalogRow[]>(
    `
      select
        pt.product_id as "productId",
        pt.locale,
        pt.full_description as "fullDescription"
      from product_translations pt
      join products p on p.id = pt.product_id
      where p.is_active = true
        and pt.locale in (${placeholders})
        and pt.full_description is not null
      order by pt.locale, pt.product_id
    `,
    [...PRODUCT_COPY_LOCALES],
  );
}

function productIdPlaceholders(productIds: number[]): { sql: string; parameters: number[] } {
  return {
    sql: productIds.map((_, index) => `$${index + 1}::integer`).join(', '),
    parameters: productIds,
  };
}

async function queryAncillarySnapshot(
  sql: QuerySql,
  productIds: number[],
): Promise<AncillarySnapshot> {
  const ids = productIdPlaceholders(productIds);
  const specs = await sql.unsafe<SpecRow[]>(
    `
      select
        id,
        product_id as "productId",
        locale,
        spec_key as "specKey",
        spec_value as "specValue"
      from product_specifications
      where product_id in (${ids.sql})
      order by product_id, locale, id
    `,
    ids.parameters,
  );
  const images = await sql.unsafe<ImageRow[]>(
    `
      select
        id,
        product_id as "productId",
        image_url as "imageUrl",
        is_primary as "isPrimary",
        display_order as "displayOrder"
      from product_images
      where product_id in (${ids.sql})
      order by product_id, display_order, id
    `,
    ids.parameters,
  );
  return { specs: [...specs], images: [...images] };
}

function translationInvariant(rows: LiveTranslationRow[]): string {
  return JSON.stringify(rows.map((row) => ({
    productId: row.productId,
    locale: row.locale,
    translationId: row.translationId,
    modelNumber: row.modelNumber,
    isActive: row.isActive,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
  })));
}

async function updateDescriptions(
  sql: postgres.TransactionSql,
  batch: ProductCopyBatch,
  direction: 'forward' | 'rollback',
): Promise<number> {
  const parameters: Array<number | string | null> = [];
  const tuples = batch.entries.map((entry, index) => {
    const offset = index * 3;
    parameters.push(
      entry.productId,
      entry.locale,
      direction === 'forward'
        ? entry.replacement.fullDescription
        : entry.expected.fullDescription,
    );
    return `($${offset + 1}::integer, $${offset + 2}::text, $${offset + 3}::text)`;
  });
  const updated = await sql.unsafe<Array<{ productId: number; locale: string }>>(
    `
      with replacements(product_id, locale, full_description) as (
        values ${tuples.join(', ')}
      )
      update product_translations pt
      set full_description = replacements.full_description
      from replacements
      where pt.product_id = replacements.product_id
        and pt.locale = replacements.locale
      returning pt.product_id as "productId", pt.locale
    `,
    parameters,
  );
  return updated.length;
}

async function updateProductTimestamps(
  sql: postgres.TransactionSql,
  productIds: number[],
): Promise<ProductTimestampRow[]> {
  const ids = productIdPlaceholders(productIds);
  const updated = await sql.unsafe<ProductTimestampRow[]>(
    `
      update products
      set updated_at = now()
      where id in (${ids.sql})
      returning id, updated_at::text as "updatedAt"
    `,
    ids.parameters,
  );
  return [...updated].sort((a, b) => a.id - b.id);
}

async function queryProductTimestamps(
  sql: QuerySql,
  productIds: number[],
): Promise<ProductTimestampRow[]> {
  const ids = productIdPlaceholders(productIds);
  const rows = await sql.unsafe<ProductTimestampRow[]>(
    `
      select id, updated_at::text as "updatedAt"
      from products
      where id in (${ids.sql})
      order by id
    `,
    ids.parameters,
  );
  return [...rows];
}

async function applyBatch(
  sql: postgres.Sql,
  batch: ProductCopyBatch,
  direction: 'forward' | 'rollback',
): Promise<ProductTimestampRow[]> {
  const productIds = [...new Set(batch.entries.map((entry) => entry.productId))].sort((a, b) => a - b);
  return await sql.begin(async (tx) => {
    await tx.unsafe("set local lock_timeout = '5s'");
    await tx.unsafe("set local statement_timeout = '30s'");

    // Product 98 is the immutable comparison source. Lock it first so every
    // row is acquired in ascending product-id order, then revalidate it in the
    // same transaction that writes products 99 and 128-147.
    const lockedReferences = await queryReferenceRows(tx, true);
    validateReferenceRows(batch, lockedReferences);
    const beforeRows = await queryTargetRows(tx, batch, true);
    validateLiveRows(batch, beforeRows, direction);
    const beforeInvariant = translationInvariant(beforeRows);
    const beforeAncillary = await queryAncillarySnapshot(tx, productIds);

    const updatedTranslations = await updateDescriptions(tx, batch, direction);
    if (updatedTranslations !== batch.entries.length) {
      throw new Error(
        `Updated ${updatedTranslations} translations; expected ${batch.entries.length}`,
      );
    }
    const updatedProducts = await updateProductTimestamps(tx, productIds);
    if (updatedProducts.length !== productIds.length) {
      throw new Error(`Updated ${updatedProducts.length} product timestamps; expected ${productIds.length}`);
    }

    const afterRows = await queryTargetRows(tx, batch);
    validateLiveRows(batch, afterRows, direction === 'forward' ? 'rollback' : 'forward');
    if (translationInvariant(afterRows) !== beforeInvariant) {
      throw new Error('A protected translation field changed during the batch');
    }
    const afterAncillary = await queryAncillarySnapshot(tx, productIds);
    if (JSON.stringify(afterAncillary) !== JSON.stringify(beforeAncillary)) {
      throw new Error('Product specifications or images changed during the batch');
    }
    return updatedProducts;
  });
}

function printQualityReport(report: ReturnType<typeof validateBatchSimilarity>): void {
  console.log(`Targets: ${report.targetCount}`);
  for (const metric of report.clusterMetrics) {
    console.log(
      `${metric.locale}: 128-147 max=${metric.max.toFixed(3)} p95=${metric.p95.toFixed(3)}`,
    );
  }
  for (const metric of report.pair98And99) {
    console.log(`${metric.locale}: 98/99=${metric.score.toFixed(3)}`);
  }
  console.log(`Maximum target-to-active-catalog similarity: ${report.maxCatalogScore.toFixed(3)}`);
}

async function main() {
  const { batchPath, mode } = parseArgs(process.argv.slice(2));
  const batch = parseBatch(JSON.parse(await readFile(batchPath, 'utf8')) as unknown);
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const isLocalDb = /@(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//.test(url);
  const sql = postgres(url, {
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 15,
    idle_timeout: 10,
  });

  try {
    const report = mode === 'rollback'
      ? (validateBatchStatic(batch), null)
      : validateBatchSimilarity(batch, await queryActiveCatalog(sql));
    const references = await queryReferenceRows(sql);
    validateReferenceRows(batch, references);

    const direction = mode === 'rollback' ? 'rollback' : 'forward';
    const currentRows = await queryTargetRows(sql, batch);
    validateLiveRows(batch, currentRows, direction);
    if (report) printQualityReport(report);
    else console.log('Rollback static validation passed; forward-only similarity gates were skipped.');

    if (mode === 'dry-run') {
      console.log('Dry-run passed. No database rows were changed.');
      return;
    }

    const committedTimestamps = await applyBatch(sql, batch, direction);
    const committedRows = await queryTargetRows(sql, batch);
    validateLiveRows(batch, committedRows, direction === 'forward' ? 'rollback' : 'forward');
    const committedReferences = await queryReferenceRows(sql);
    validateReferenceRows(batch, committedReferences);
    const productIds = [...new Set(batch.entries.map((entry) => entry.productId))].sort((a, b) => a - b);
    const liveTimestamps = await queryProductTimestamps(sql, productIds);
    if (JSON.stringify(liveTimestamps) !== JSON.stringify(committedTimestamps)) {
      throw new Error('Post-commit product updated_at verification failed');
    }
    console.log(
      `${mode === 'apply' ? 'Applied' : 'Rolled back'} ${batch.entries.length} translations across ${new Set(batch.entries.map((entry) => entry.productId)).size} products.`,
    );
    console.log('Post-commit verification passed.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
