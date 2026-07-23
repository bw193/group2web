import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  parseBatch,
  validateBatchStatic,
  type ProductCopyBatchEntry,
  type ProductCopyLocale,
} from './product-copy-batch-lib';

type Options = {
  batchPath: string;
  origin: string;
  concurrency: number;
};

type PageExpectation = {
  entry: ProductCopyBatchEntry;
  url: string;
  alternates: Map<ProductCopyLocale, string>;
};

type PageResult = {
  key: string;
  url: string;
  errors: string[];
};

function usage(): never {
  throw new Error(
    'Usage: npx tsx scripts/verify-product-copy-production.ts --batch <batch.json> [--origin https://chengtaimirror.com] [--concurrency 8]',
  );
}

function parseArgs(argv: string[]): Options {
  const batchIndex = argv.indexOf('--batch');
  if (batchIndex < 0 || !argv[batchIndex + 1]) usage();

  const originIndex = argv.indexOf('--origin');
  const concurrencyIndex = argv.indexOf('--concurrency');
  const origin = (originIndex >= 0 ? argv[originIndex + 1] : 'https://chengtaimirror.com')
    ?.replace(/\/+$/, '');
  if (!origin || !/^https?:\/\//i.test(origin)) {
    throw new Error('--origin must be an absolute HTTP(S) URL');
  }

  const concurrency = Number(concurrencyIndex >= 0 ? argv[concurrencyIndex + 1] : 8);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new Error('--concurrency must be an integer between 1 and 32');
  }

  return { batchPath: resolve(argv[batchIndex + 1]), origin, concurrency };
}

function localizedPath(locale: ProductCopyLocale, slug: string): string {
  const segment = encodeURIComponent(slug);
  return locale === 'he'
    ? `/he/israel-products/${segment}`
    : `/${locale}/products/${segment}`;
}

function parseAttributes(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of tag.matchAll(/\s([:\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function linkElements(html: string): Array<Map<string, string>> {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => parseAttributes(match[0]));
}

function htmlAttributes(html: string): Map<string, string> {
  const match = html.match(/<html\b[^>]*>/i);
  return match ? parseAttributes(match[0]) : new Map();
}

function buildExpectations(
  entries: ProductCopyBatchEntry[],
  origin: string,
): PageExpectation[] {
  const alternatesByProduct = new Map<number, Map<ProductCopyLocale, string>>();
  for (const entry of entries) {
    const alternates = alternatesByProduct.get(entry.productId) ?? new Map<ProductCopyLocale, string>();
    alternates.set(entry.locale, `${origin}${localizedPath(entry.locale, entry.expected.slug)}`);
    alternatesByProduct.set(entry.productId, alternates);
  }

  return entries.map((entry) => ({
    entry,
    url: `${origin}${localizedPath(entry.locale, entry.expected.slug)}`,
    alternates: alternatesByProduct.get(entry.productId)!,
  }));
}

async function verifyPage(expectation: PageExpectation): Promise<PageResult> {
  const { entry, url, alternates } = expectation;
  const key = `${entry.productId}:${entry.locale}`;
  const errors: string[] = [];

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'Chengtai product-copy release verifier/1.0' },
      signal: AbortSignal.timeout(20_000),
    });
    const html = await response.text();

    if (response.status !== 200) errors.push(`expected HTTP 200, received ${response.status}`);
    if (response.url.replace(/\/$/, '') !== url.replace(/\/$/, '')) {
      errors.push(`unexpected final URL ${response.url}`);
    }
    if (!html.includes(entry.replacement.fullDescription)) {
      errors.push('replacement full description is missing');
    }
    if (
      entry.expected.fullDescription &&
      entry.expected.fullDescription !== entry.replacement.fullDescription &&
      html.includes(entry.expected.fullDescription)
    ) {
      errors.push('previous full description is still present');
    }

    const links = linkElements(html);
    const canonical = links.filter((attributes) =>
      attributes.get('rel')?.split(/\s+/).includes('canonical'),
    );
    if (canonical.length !== 1) {
      errors.push(`expected one canonical link, received ${canonical.length}`);
    } else if (canonical[0].get('href') !== url) {
      errors.push(`canonical mismatch: ${canonical[0].get('href') ?? '(missing href)'}`);
    }

    for (const [locale, alternateUrl] of alternates) {
      const matchingAlternate = links.some(
        (attributes) =>
          attributes.get('rel')?.split(/\s+/).includes('alternate') &&
          attributes.get('hreflang') === locale &&
          attributes.get('href') === alternateUrl,
      );
      if (!matchingAlternate) {
        errors.push(`missing hreflang ${locale} -> ${alternateUrl}`);
      }
    }

    const root = htmlAttributes(html);
    if (root.get('lang') !== entry.locale) {
      errors.push(`html lang mismatch: ${root.get('lang') ?? '(missing)'}`);
    }
    const expectedDirection = entry.locale === 'he' ? 'rtl' : 'ltr';
    if (root.get('dir') !== expectedDirection) {
      errors.push(`html dir mismatch: ${root.get('dir') ?? '(missing)'}`);
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { key, url, errors };
}

async function mapConcurrent<T, R>(
  values: T[],
  concurrency: number,
  callback: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await callback(values[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const batch = parseBatch(JSON.parse(await readFile(options.batchPath, 'utf8')) as unknown);
  validateBatchStatic(batch);

  const expectations = buildExpectations(batch.entries, options.origin);
  const results = await mapConcurrent(expectations, options.concurrency, verifyPage);
  const failures = results.filter((result) => result.errors.length > 0);
  const spotCheckIds = new Set([99, 129, 136, 141, 146]);
  const spotChecks = results.filter((result) => spotCheckIds.has(Number(result.key.split(':')[0])));

  console.log(`Checked ${results.length} localized product pages at ${options.origin}.`);
  console.log(`Spot checks passed: ${spotChecks.filter((result) => result.errors.length === 0).length}/${spotChecks.length}.`);

  if (failures.length > 0) {
    console.error(`Production verification failed for ${failures.length} page(s):`);
    for (const failure of failures) {
      console.error(`- ${failure.key} ${failure.url}`);
      for (const error of failure.errors) console.error(`  - ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('All pages returned 200 with the replacement copy, stable canonical/hreflang URLs, and correct text direction.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
