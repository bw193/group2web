import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb, withDbRetryFast } from '@/lib/db';
import { articles, articleTranslations, articleTranslationBodies, articleProducts } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { locales } from '@/i18n/config';

// The journal list shows English-fallback rows in every locale, so any article
// change must refresh the index in all locales, not just the ones that have a
// translation. Page-path ISR invalidation, exactly like the product routes.
function revalidateInsightIndexes() {
  for (const loc of locales) {
    revalidatePath(`/${loc}/insight`);
  }
}

// CMS-only API: unlike products there is no public consumer, and the list
// includes hidden drafts - so even GET requires a session.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = getDb();
  const all = await withDbRetryFast(() =>
    db.select().from(articles).orderBy(desc(articles.publishedAt), desc(articles.id)),
  );
  if (all.length === 0) return NextResponse.json([]);

  const ids = all.map((a) => a.id);
  const trans = await withDbRetryFast(() =>
    db.select().from(articleTranslations).where(inArray(articleTranslations.articleId, ids)),
  );

  const byArticle = new Map<number, (typeof trans)[number][]>();
  for (const t of trans) {
    const list = byArticle.get(t.articleId) ?? [];
    list.push(t);
    byArticle.set(t.articleId, list);
  }

  const result = all.map((a) => {
    const list = byArticle.get(a.id) ?? [];
    const en = list.find((t) => t.locale === 'en') ?? list[0];
    return {
      id: a.id,
      category: a.category,
      readMinutes: a.readMinutes,
      isFeatured: a.isFeatured,
      isActive: a.isActive,
      publishedAt: a.publishedAt,
      coverImageUrl: a.coverImageUrl,
      thumbnailUrl: a.thumbnailUrl,
      title: en?.title ?? `Article ${a.id}`,
      slug: en?.slug ?? '',
      locales: list.map((t) => t.locale),
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as any;
    const translations = Array.isArray(body.translations) ? body.translations : [];
    if (translations.length === 0 || !translations.some((t: any) => t?.title?.trim())) {
      return NextResponse.json({ error: 'At least one titled translation is required' }, { status: 400 });
    }

    const db = getDb();

    // (locale, slug) is the routing key - reject duplicates up front so the
    // editor gets a usable message instead of a raw unique-index failure.
    for (const t of translations) {
      const slug = t.slug?.trim() || slugify(t.title || '');
      if (!slug) continue;
      const clash = await db
        .select({ id: articleTranslations.id })
        .from(articleTranslations)
        .where(and(eq(articleTranslations.locale, t.locale), eq(articleTranslations.slug, slug)))
        .limit(1);
      if (clash.length > 0) {
        return NextResponse.json(
          { error: `Slug "${slug}" is already used by another ${t.locale} article` },
          { status: 409 },
        );
      }
    }

    const [article] = await db
      .insert(articles)
      .values({
        category: body.category || 'design',
        readMinutes: typeof body.readMinutes === 'number' && body.readMinutes > 0 ? body.readMinutes : 5,
        isFeatured: body.isFeatured || false,
        isActive: body.isActive !== false,
        publishedAt: body.publishedAt ? new Date(body.publishedAt).toISOString() : undefined,
        coverImageUrl: body.coverImageUrl || null,
        thumbnailUrl: body.thumbnailUrl || null,
        createdBy: session.userId,
      })
      .returning();

    for (const t of translations) {
      if (!t?.locale || !t?.title?.trim()) continue;
      const [trans] = await db
        .insert(articleTranslations)
        .values({
          articleId: article.id,
          locale: t.locale,
          title: t.title.trim(),
          slug: t.slug?.trim() || slugify(t.title),
          dek: t.dek || null,
          author: t.author || null,
        })
        .returning({ id: articleTranslations.id });
      // Body lives only in article_translation_bodies (legacy column dropped
      // in 0007); article_translations stays light like product_translations.
      await db.insert(articleTranslationBodies).values({
        articleTranslationId: trans.id,
        body: t.body || null,
      });
    }

    if (Array.isArray(body.productIds)) {
      for (let i = 0; i < body.productIds.length; i++) {
        const pid = parseInt(body.productIds[i]);
        if (Number.isNaN(pid)) continue;
        await db.insert(articleProducts).values({
          articleId: article.id,
          productId: pid,
          displayOrder: i,
        });
      }
    }

    revalidateInsightIndexes();
    const created = await db
      .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
      .from(articleTranslations)
      .where(eq(articleTranslations.articleId, article.id));
    for (const t of created) {
      revalidatePath(`/${t.locale}/insight/${t.slug}`);
    }

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
