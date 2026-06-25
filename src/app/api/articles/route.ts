import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb, withDbRetryFast } from '@/lib/db';
import { articles, articleTranslations, articleTranslationBodies, articleProducts } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { locales } from '@/i18n/config';
import {
  ARTICLE_SLUG_SOURCE_LOCALE,
  articleSlugFromInput,
  disambiguateSharedArticleSlug,
  resolveArticleTranslationSlug,
} from '@/lib/articles';

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
    const translationInputs = translations.filter((t: any) => t?.locale && t?.title?.trim());
    if (translationInputs.length === 0) {
      return NextResponse.json({ error: 'At least one titled translation is required' }, { status: 400 });
    }
    const englishInput = translationInputs.find((t: any) => t.locale === ARTICLE_SLUG_SOURCE_LOCALE);
    const desiredEnglishSlug = articleSlugFromInput(englishInput || {});
    if (!englishInput || !desiredEnglishSlug) {
      return NextResponse.json(
        { error: 'English article translation with a valid slug or title is required' },
        { status: 400 },
      );
    }

    const db = getDb();

    const { article, finalTranslations } = await db.transaction(async (tx) => {
      const [created] = await tx
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

      const finalEnglishSlug = await disambiguateSharedArticleSlug(tx, {
        locales,
        slug: desiredEnglishSlug,
        articleId: created.id,
      });

      const finalT: { locale: string; slug: string }[] = [];
      for (const t of translationInputs) {
        const finalSlug = resolveArticleTranslationSlug({
          locale: t.locale,
          englishSlug: finalEnglishSlug,
        });
        const [trans] = await tx
          .insert(articleTranslations)
          .values({
            articleId: created.id,
            locale: t.locale,
            title: t.title.trim(),
            slug: finalSlug,
            dek: t.dek || null,
            author: t.author || null,
          })
          .returning({ id: articleTranslations.id });
        await tx.insert(articleTranslationBodies).values({
          articleTranslationId: trans.id,
          body: t.body || null,
        });
        finalT.push({ locale: t.locale, slug: finalSlug });
      }

      if (Array.isArray(body.productIds)) {
        for (let i = 0; i < body.productIds.length; i++) {
          const pid = parseInt(body.productIds[i]);
          if (Number.isNaN(pid)) continue;
          await tx.insert(articleProducts).values({
            articleId: created.id,
            productId: pid,
            displayOrder: i,
          });
        }
      }

      return { article: created, finalTranslations: finalT };
    });

    revalidateInsightIndexes();
    for (const t of finalTranslations) {
      revalidatePath(`/${t.locale}/insight/${t.slug}`);
    }

    return NextResponse.json({ ...article, translations: finalTranslations }, { status: 201 });
  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
