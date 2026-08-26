import { NextRequest, NextResponse } from 'next/server';
import { getDb, withDbRetryFast } from '@/lib/db';
import { products, productSpecifications, productTranslations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import {
  assessSeoRisk,
  compareProductTexts,
  prepareProductText,
  type PreparedProductText,
  type ProductSimilarityScores,
  type SeoRisk,
} from '@/lib/similarity';

const DEFAULT_REPORT_THRESHOLD = 0.35;
const DRAFT_MATCH_THRESHOLD = 0.2;
const DRAFT_MATCH_LIMIT = 8;
const REPORT_PAIR_LIMIT = 200;

type CatalogEntry = {
  id: number;
  name: string;
  slug: string;
  modelNumber: string | null;
  isActive: boolean;
  prepared: PreparedProductText;
};

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundScores(scores: ProductSimilarityScores): ProductSimilarityScores {
  return {
    nameScore: round3(scores.nameScore),
    shortScore: round3(scores.shortScore),
    fullScore: round3(scores.fullScore),
    contentScore: round3(scores.contentScore),
    overall: round3(scores.overall),
  };
}

/** Loads every product (active and inactive) with its translation for the locale,
 *  tokenized once so pairwise comparisons only intersect precomputed sets. */
async function loadCatalog(locale: string): Promise<CatalogEntry[]> {
  const db = getDb();
  const allProducts = await withDbRetryFast(() => db.select().from(products));
  if (allProducts.length === 0) return [];

  const trans = await withDbRetryFast(() =>
    db.select().from(productTranslations).where(eq(productTranslations.locale, locale)),
  );
  const specRows = await withDbRetryFast(() =>
    db.select().from(productSpecifications).where(eq(productSpecifications.locale, locale)),
  );

  const specsByProduct = new Map<number, string[]>();
  for (const spec of specRows) {
    const parts = specsByProduct.get(spec.productId) ?? [];
    parts.push(`${spec.specKey} ${spec.specValue}`);
    specsByProduct.set(spec.productId, parts);
  }

  const productById = new Map(allProducts.map((p) => [p.id, p]));
  const entries: CatalogEntry[] = [];
  for (const t of trans) {
    const product = productById.get(t.productId);
    if (!product) continue;
    entries.push({
      id: product.id,
      name: t.name,
      slug: t.slug,
      modelNumber: product.modelNumber,
      isActive: product.isActive,
      prepared: prepareProductText(
        {
          name: t.name,
          shortDescription: t.shortDescription,
          fullDescription: t.fullDescription,
          specifications: (specsByProduct.get(t.productId) ?? []).join('. '),
        },
        locale,
      ),
    });
  }
  return entries;
}

function productSummary(entry: CatalogEntry) {
  return {
    id: entry.id,
    name: entry.name,
    slug: entry.slug,
    modelNumber: entry.modelNumber,
    isActive: entry.isActive,
  };
}

const SORT_KEYS = {
  content: 'contentScore',
  overall: 'overall',
  name: 'nameScore',
  short: 'shortScore',
  full: 'fullScore',
} as const;

// Full-catalog report: every pair of products in the locale scoring >= threshold.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'en';
  const thresholdParam = parseFloat(searchParams.get('threshold') || '');
  const threshold = Number.isFinite(thresholdParam)
    ? Math.min(Math.max(thresholdParam, 0.05), 1)
    : DEFAULT_REPORT_THRESHOLD;
  // Default to whole-page content containment: the closest proxy to Google's dedup.
  const sortParam = searchParams.get('sort') || 'content';
  const sortKey = SORT_KEYS[sortParam as keyof typeof SORT_KEYS] ?? 'contentScore';
  const statusParam = searchParams.get('status');
  const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';

  try {
    let catalog = await loadCatalog(locale);
    if (status === 'active') catalog = catalog.filter((entry) => entry.isActive);
    if (status === 'inactive') catalog = catalog.filter((entry) => !entry.isActive);

    const pairs: Array<ProductSimilarityScores & {
      a: ReturnType<typeof productSummary>;
      b: ReturnType<typeof productSummary>;
      risk: SeoRisk;
    }> = [];
    for (let i = 0; i < catalog.length; i += 1) {
      for (let j = i + 1; j < catalog.length; j += 1) {
        const scores = compareProductTexts(catalog[i].prepared, catalog[j].prepared);
        // Threshold applies to the sorted column, so each view only surfaces
        // pairs that actually overlap on that field (product names naturally
        // share family terms and would otherwise drown out content duplicates).
        if (scores[sortKey] < threshold) continue;
        pairs.push({
          a: productSummary(catalog[i]),
          b: productSummary(catalog[j]),
          ...roundScores(scores),
          risk: assessSeoRisk(scores),
        });
      }
    }
    // Sort before truncating so the top pairs are accurate for the chosen column.
    pairs.sort((x, y) => (y[sortKey] - x[sortKey]) || (y.overall - x.overall));

    return NextResponse.json({
      locale,
      threshold,
      sort: sortParam in SORT_KEYS ? sortParam : 'content',
      status,
      scannedCount: catalog.length,
      pairCount: pairs.length,
      truncated: pairs.length > REPORT_PAIR_LIMIT,
      pairs: pairs.slice(0, REPORT_PAIR_LIMIT),
    });
  } catch (error) {
    console.error('Similarity report error:', error);
    return NextResponse.json({ error: 'Failed to build similarity report' }, { status: 500 });
  }
}

// Draft check: compare unsaved editor content against the existing catalog.
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      productId?: unknown;
      locale?: unknown;
      name?: unknown;
      shortDescription?: unknown;
      fullDescription?: unknown;
      specifications?: unknown;
    };
    const locale = typeof body.locale === 'string' && body.locale ? body.locale : 'en';
    const excludeId = typeof body.productId === 'number' ? body.productId : null;
    const draft = {
      name: typeof body.name === 'string' ? body.name : '',
      shortDescription: typeof body.shortDescription === 'string' ? body.shortDescription : '',
      fullDescription: typeof body.fullDescription === 'string' ? body.fullDescription : '',
      specifications: typeof body.specifications === 'string' ? body.specifications : '',
    };

    if (!draft.name.trim() && !draft.shortDescription.trim() && !draft.fullDescription.trim()) {
      return NextResponse.json({ locale, matches: [] });
    }

    const prepared = prepareProductText(draft, locale);
    const catalog = await loadCatalog(locale);

    const matches: Array<ProductSimilarityScores & {
      product: ReturnType<typeof productSummary>;
      risk: SeoRisk;
    }> = [];
    for (const entry of catalog) {
      if (excludeId !== null && entry.id === excludeId) continue;
      const scores = compareProductTexts(prepared, entry.prepared);
      if (Math.max(scores.overall, scores.contentScore) < DRAFT_MATCH_THRESHOLD) continue;
      matches.push({ product: productSummary(entry), ...roundScores(scores), risk: assessSeoRisk(scores) });
    }
    matches.sort((x, y) => (y.contentScore - x.contentScore) || (y.overall - x.overall));

    return NextResponse.json({ locale, matches: matches.slice(0, DRAFT_MATCH_LIMIT) });
  } catch (error) {
    console.error('Similarity check error:', error);
    return NextResponse.json({ error: 'Failed to check similarity' }, { status: 500 });
  }
}
