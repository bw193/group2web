import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import postgres from 'postgres';
import {
  PRODUCT_COPY_LOCALES,
  expectedTargetKeys,
  parseDraftEntries,
  sha256,
  sortDraftEntries,
  targetKey,
  validateBatchSimilarity,
  validateBatchStatic,
  type ProductCopyBatch,
  type ProductCopyDraftEntry,
} from './product-copy-batch-lib';

loadEnvConfig(process.cwd());

type DbRow = {
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

function usage(): never {
  throw new Error(
    'Usage: npx tsx scripts/create-product-copy-batch.ts --output <batch.json> <draft.json> [draft.json ...]',
  );
}

function parseArgs(argv: string[]): { output: string; drafts: string[] } {
  const outputIndex = argv.indexOf('--output');
  if (outputIndex < 0 || !argv[outputIndex + 1]) usage();
  const output = resolve(argv[outputIndex + 1]);
  const drafts = argv
    .filter((value, index) => index !== outputIndex && index !== outputIndex + 1)
    .map((value) => resolve(value));
  if (drafts.length === 0) usage();
  return { output, drafts };
}

async function readDrafts(paths: string[]): Promise<ProductCopyDraftEntry[]> {
  const entries: ProductCopyDraftEntry[] = [];
  for (const path of paths) {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
    entries.push(...parseDraftEntries(parsed, path));
  }
  return sortDraftEntries(entries);
}

function assertExactDraftTargets(entries: ProductCopyDraftEntry[]): void {
  const expected = expectedTargetKeys();
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const entry of entries) {
    const key = targetKey(entry.productId, entry.locale);
    if (seen.has(key)) errors.push(`${key}: duplicate draft target`);
    seen.add(key);
  }
  for (const key of expected) if (!seen.has(key)) errors.push(`${key}: missing draft target`);
  for (const key of seen) if (!expected.includes(key)) errors.push(`${key}: unexpected draft target`);
  if (entries.length !== expected.length) {
    errors.push(`expected ${expected.length} draft entries; received ${entries.length}`);
  }
  if (errors.length > 0) throw new Error(`Draft target validation failed:\n- ${errors.join('\n- ')}`);
}

async function main() {
  const { output, drafts } = parseArgs(process.argv.slice(2));
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const entries = await readDrafts(drafts);
  assertExactDraftTargets(entries);

  const isLocalDb = /@(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//.test(url);
  const sql = postgres(url, {
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 15,
    idle_timeout: 10,
  });

  try {
    const productIds = [98, 99, ...Array.from({ length: 20 }, (_, index) => 128 + index)];
    const rows = await sql<DbRow[]>`
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
      where pt.product_id in ${sql(productIds)}
      order by pt.product_id, pt.locale
    `;
    const byKey = new Map(rows.map((row) => [targetKey(row.productId, row.locale), row]));

    const batch: ProductCopyBatch = {
      schemaVersion: 1,
      batchId: basename(output, '.json'),
      createdAt: new Date().toISOString(),
      entries: entries.map((draft) => {
        const key = targetKey(draft.productId, draft.locale);
        const current = byKey.get(key);
        if (!current) throw new Error(`${key}: current database row is missing`);
        if (!current.isActive) throw new Error(`${key}: product is inactive`);
        return {
          productId: draft.productId,
          locale: draft.locale,
          expected: {
            modelNumber: current.modelNumber,
            translationId: current.translationId,
            slug: current.slug,
            nameSha256: sha256(current.name),
            shortDescriptionSha256: sha256(current.shortDescription),
            fullDescription: current.fullDescription,
            fullDescriptionSha256: sha256(current.fullDescription),
          },
          replacement: {
            fullDescription: draft.fullDescription,
            fullDescriptionSha256: sha256(draft.fullDescription),
          },
        };
      }),
      references: PRODUCT_COPY_LOCALES.map((locale) => {
        const key = targetKey(98, locale);
        const current = byKey.get(key);
        if (!current) throw new Error(`${key}: product 98 reference row is missing`);
        return {
          productId: 98 as const,
          locale,
          modelNumber: current.modelNumber,
          translationId: current.translationId,
          slug: current.slug,
          fullDescription: current.fullDescription,
          fullDescriptionSha256: sha256(current.fullDescription),
        };
      }),
    };

    validateBatchStatic(batch);
    const report = validateBatchSimilarity(batch);
    await writeFile(output, `${JSON.stringify(batch, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    console.log(`Created ${output}`);
    console.log(`Targets: ${report.targetCount}`);
    for (const metric of report.clusterMetrics) {
      console.log(
        `${metric.locale}: cluster max=${metric.max.toFixed(3)} p95=${metric.p95.toFixed(3)}`,
      );
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
