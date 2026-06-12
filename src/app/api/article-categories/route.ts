import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getDb, withDbRetryFast } from '@/lib/db';
import { articles, articleCategories, articleCategoryTranslations } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { locales } from '@/i18n/config';
import { INSIGHT_TAGS } from '@/lib/insight';

// Bust both data-cache (unstable_cache: categories + articles, since the
// list page joins category labels onto article rows) and rendered HTML/RSC.
function revalidateInsightIndexes() {
  revalidateTag(INSIGHT_TAGS.categories);
  revalidateTag(INSIGHT_TAGS.articles);
  for (const loc of locales) {
    revalidatePath(`/${loc}/insight`);
  }
}

// CMS-only API (the public pages read categories straight from the DB).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = getDb();
  // Deliberately sequential: parallel queries force the pool to open extra
  // connections, and on the long-haul dev link a fresh handshake can wedge 鈥?
  // sequential reads ride the one warm connection. withDbRetryFast caps any
  // residual stall instead of letting the route hang.
  const cats = await withDbRetryFast(() =>
    db.select().from(articleCategories).orderBy(articleCategories.displayOrder, articleCategories.id),
  );
  const trans = await withDbRetryFast(() => db.select().from(articleCategoryTranslations));
  const counts = await withDbRetryFast(() =>
    db
      .select({ category: articles.category, n: sql<number>`count(*)::int` })
      .from(articles)
      .groupBy(articles.category),
  );

  const namesByCat = new Map<number, Record<string, string>>();
  for (const t of trans) {
    const m = namesByCat.get(t.categoryId) ?? {};
    m[t.locale] = t.name;
    namesByCat.set(t.categoryId, m);
  }
  const countByKey = new Map(counts.map((c) => [c.category, c.n]));

  return NextResponse.json(
    cats.map((c) => ({
      id: c.id,
      key: c.key,
      displayOrder: c.displayOrder,
      names: namesByCat.get(c.id) ?? {},
      articleCount: countByKey.get(c.key) ?? 0,
    })),
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as any;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const key = body.key?.trim() ? slugify(body.key) : slugify(name);
    if (!key) {
      return NextResponse.json({ error: 'Could not derive a key from the name' }, { status: 400 });
    }

    const db = getDb();
    const clash = await db
      .select({ id: articleCategories.id })
      .from(articleCategories)
      .where(eq(articleCategories.key, key))
      .limit(1);
    if (clash.length > 0) {
      return NextResponse.json({ error: `Category "${key}" already exists` }, { status: 409 });
    }

    const [{ maxOrder }] = await db
      .select({ maxOrder: sql<number>`coalesce(max(${articleCategories.displayOrder}), -1)::int` })
      .from(articleCategories);

    const [created] = await db
      .insert(articleCategories)
      .values({ key, displayOrder: maxOrder + 1 })
      .returning();
    await db.insert(articleCategoryTranslations).values({
      categoryId: created.id,
      locale: 'en',
      name,
    });

    revalidateInsightIndexes();
    return NextResponse.json({ ...created, names: { en: name }, articleCount: 0 }, { status: 201 });
  } catch (error) {
    console.error('Create article category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
