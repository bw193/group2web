import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb, withDbRetryFast } from '@/lib/db';
import { articles, articleTranslations, articleProducts } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { locales } from '@/i18n/config';

// See sibling route.ts: page-path ISR invalidation, exactly like products.
function revalidateInsightIndexes() {
  for (const loc of locales) {
    revalidatePath(`/${loc}/insight`);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const articleId = parseInt(id);
  if (Number.isNaN(articleId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const db = getDb();
  const [article] = await withDbRetryFast(() =>
    db.select().from(articles).where(eq(articles.id, articleId)).limit(1),
  );
  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  // Sequential on purpose — see /api/article-categories: parallel queries
  // demand extra pool connections and fresh handshakes wedge on the dev link.
  const translations = await withDbRetryFast(() =>
    db.select().from(articleTranslations).where(eq(articleTranslations.articleId, articleId)),
  );
  const links = await withDbRetryFast(() =>
    db
      .select()
      .from(articleProducts)
      .where(eq(articleProducts.articleId, articleId))
      .orderBy(articleProducts.displayOrder),
  );

  return NextResponse.json({
    ...article,
    translations,
    productIds: links.map((l) => l.productId),
  });
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
  const articleId = parseInt(id);
  if (Number.isNaN(articleId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const body = (await request.json()) as any;

  const db = getDb();
  const [existing] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  // Capture current slugs before mutating so a slug change also busts the old URL.
  const prevTrans = await db
    .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, articleId));

  if (Array.isArray(body.translations)) {
    // Pre-check the (locale, slug) routing key against other articles.
    for (const t of body.translations) {
      const slug = t.slug?.trim() || slugify(t.title || '');
      if (!t?.locale || !slug) continue;
      const clash = await db
        .select({ id: articleTranslations.id })
        .from(articleTranslations)
        .where(
          and(
            eq(articleTranslations.locale, t.locale),
            eq(articleTranslations.slug, slug),
            ne(articleTranslations.articleId, articleId),
          ),
        )
        .limit(1);
      if (clash.length > 0) {
        return NextResponse.json(
          { error: `Slug "${slug}" is already used by another ${t.locale} article` },
          { status: 409 },
        );
      }
    }
  }

  await db
    .update(articles)
    .set({
      category: body.category ?? existing.category,
      readMinutes:
        typeof body.readMinutes === 'number' && body.readMinutes > 0
          ? body.readMinutes
          : existing.readMinutes,
      isFeatured: body.isFeatured ?? existing.isFeatured,
      isActive: body.isActive ?? existing.isActive,
      publishedAt: body.publishedAt ? new Date(body.publishedAt).toISOString() : existing.publishedAt,
      coverImageUrl: body.coverImageUrl !== undefined ? body.coverImageUrl || null : existing.coverImageUrl,
      thumbnailUrl: body.thumbnailUrl !== undefined ? body.thumbnailUrl || null : existing.thumbnailUrl,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(articles.id, articleId));

  // Upsert per-locale translations — locales not present in the payload are
  // left untouched (script-inserted translations survive CMS saves).
  if (Array.isArray(body.translations)) {
    for (const t of body.translations) {
      if (!t?.locale || !t?.title?.trim()) continue;
      const values = {
        title: t.title.trim(),
        slug: t.slug?.trim() || slugify(t.title),
        dek: t.dek || null,
        body: t.body || null,
        author: t.author || null,
      };
      const [existingTrans] = await db
        .select()
        .from(articleTranslations)
        .where(
          and(eq(articleTranslations.articleId, articleId), eq(articleTranslations.locale, t.locale)),
        )
        .limit(1);
      if (existingTrans) {
        await db.update(articleTranslations).set(values).where(eq(articleTranslations.id, existingTrans.id));
      } else {
        await db.insert(articleTranslations).values({ articleId, locale: t.locale, ...values });
      }
    }
  }

  if (Array.isArray(body.productIds)) {
    await db.delete(articleProducts).where(eq(articleProducts.articleId, articleId));
    for (let i = 0; i < body.productIds.length; i++) {
      const pid = parseInt(body.productIds[i]);
      if (Number.isNaN(pid)) continue;
      await db.insert(articleProducts).values({ articleId, productId: pid, displayOrder: i });
    }
  }

  // Bust ISR: old + new detail URLs (slug may have changed) and every
  // locale's journal index (EN fallback surfaces edits everywhere).
  const newTrans = await db
    .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, articleId));
  for (const t of [...prevTrans, ...newTrans]) {
    revalidatePath(`/${t.locale}/insight/${t.slug}`);
  }
  revalidateInsightIndexes();

  return NextResponse.json({ message: 'Article updated' });
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
  const articleId = parseInt(id);
  if (Number.isNaN(articleId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const db = getDb();

  const delTrans = await db
    .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
    .from(articleTranslations)
    .where(eq(articleTranslations.articleId, articleId));

  await db.delete(articles).where(eq(articles.id, articleId));

  for (const t of delTrans) {
    revalidatePath(`/${t.locale}/insight/${t.slug}`);
  }
  revalidateInsightIndexes();

  return NextResponse.json({ message: 'Article deleted' });
}
