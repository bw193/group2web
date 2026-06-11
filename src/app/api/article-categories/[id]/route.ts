import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db';
import {
  articles,
  articleTranslations,
  articleCategories,
  articleCategoryTranslations,
} from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { locales } from '@/i18n/config';

function revalidateInsightIndexes() {
  for (const loc of locales) {
    revalidatePath(`/${loc}/insight`);
  }
}

/** Bust the detail pages of every article in this category (label appears there). */
async function revalidateCategoryArticles(key: string) {
  const db = getDb();
  const rows = await db
    .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
    .from(articleTranslations)
    .innerJoin(articles, eq(articles.id, articleTranslations.articleId))
    .where(eq(articles.category, key));
  for (const r of rows) {
    revalidatePath(`/${r.locale}/insight/${r.slug}`);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = parseInt(id);
  if (Number.isNaN(categoryId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const body = (await request.json()) as any;

  const db = getDb();
  const [existing] = await db
    .select()
    .from(articleCategories)
    .where(eq(articleCategories.id, categoryId))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  if (typeof body.displayOrder === 'number') {
    await db
      .update(articleCategories)
      .set({ displayOrder: body.displayOrder })
      .where(eq(articleCategories.id, categoryId));
  }

  // The CMS edits the English name; other locales fall back to it on the
  // public site until script-inserted translations exist (same convention
  // as products). `key` is immutable — it's what articles reference.
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name) {
    const [enRow] = await db
      .select()
      .from(articleCategoryTranslations)
      .where(
        and(
          eq(articleCategoryTranslations.categoryId, categoryId),
          eq(articleCategoryTranslations.locale, 'en'),
        ),
      )
      .limit(1);
    if (enRow) {
      await db
        .update(articleCategoryTranslations)
        .set({ name })
        .where(eq(articleCategoryTranslations.id, enRow.id));
    } else {
      await db
        .insert(articleCategoryTranslations)
        .values({ categoryId, locale: 'en', name });
    }
  }

  revalidateInsightIndexes();
  await revalidateCategoryArticles(existing.key);

  return NextResponse.json({ message: 'Category updated' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const categoryId = parseInt(id);
  if (Number.isNaN(categoryId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(articleCategories)
    .where(eq(articleCategories.id, categoryId))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  // Refuse to delete a category that articles still reference — reassign the
  // articles first. Keeps every article's category label resolvable.
  const [{ inUse }] = await db
    .select({ inUse: sql<number>`count(*)::int` })
    .from(articles)
    .where(eq(articles.category, existing.key));
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Category is used by ${inUse} article(s) — move them first`, inUse },
      { status: 409 },
    );
  }

  await db.delete(articleCategories).where(eq(articleCategories.id, categoryId));

  revalidateInsightIndexes();
  return NextResponse.json({ message: 'Category deleted' });
}
