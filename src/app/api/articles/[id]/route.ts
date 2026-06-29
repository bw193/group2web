import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb, withDbRetryFast } from '@/lib/db';
import { articles, articleTranslations, articleTranslationBodies, articleProducts, articleSlugHistory } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { locales } from '@/i18n/config';
import {
  ARTICLE_SLUG_SOURCE_LOCALE,
  articleSlugFromInput,
  disambiguateSharedArticleSlug,
  resolveArticleTranslationSlug,
} from '@/lib/articles';

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

  // Sequential on purpose - see /api/article-categories: parallel queries
  // demand extra pool connections and fresh handshakes wedge on the dev link.
  const translations = await withDbRetryFast(() =>
    db.select().from(articleTranslations).where(eq(articleTranslations.articleId, articleId)),
  );
  // Body lives in article_translation_bodies now - fetch and attach it so the
  // editor still receives each translation's body.
  const bodies = translations.length
    ? await withDbRetryFast(() =>
        db
          .select()
          .from(articleTranslationBodies)
          .where(
            inArray(
              articleTranslationBodies.articleTranslationId,
              translations.map((t) => t.id),
            ),
          ),
      )
    : [];
  const bodyById = new Map(bodies.map((b) => [b.articleTranslationId, b.body]));
  const links = await withDbRetryFast(() =>
    db
      .select()
      .from(articleProducts)
      .where(eq(articleProducts.articleId, articleId))
      .orderBy(articleProducts.displayOrder),
  );

  return NextResponse.json({
    ...article,
    translations: translations.map((t) => ({ ...t, body: bodyById.get(t.id) ?? null })),
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
  const prevSlugByLocale = new Map(prevTrans.map((t) => [t.locale, t.slug]));
  const currentEnglishSlug = prevSlugByLocale.get(ARTICLE_SLUG_SOURCE_LOCALE) ?? null;
  const translationInputs = Array.isArray(body.translations)
    ? body.translations.filter((t: any) => t?.locale && t?.title?.trim())
    : [];
  const englishInput = translationInputs.find((t: any) => t.locale === ARTICLE_SLUG_SOURCE_LOCALE);

  let newTrans: { locale: string; slug: string }[] = [];
  try {
    newTrans = await db.transaction(async (tx) => {
      await tx
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

      let finalEnglishSlug = currentEnglishSlug;
      if (Array.isArray(body.translations)) {
        const localesNeedingEnglishSlug = new Set<string>(locales);
        for (const t of prevTrans) localesNeedingEnglishSlug.add(t.locale);
        for (const t of translationInputs) localesNeedingEnglishSlug.add(t.locale);

        const desiredEnglishSlug = englishInput
          ? articleSlugFromInput(englishInput)
          : currentEnglishSlug;
        if (!desiredEnglishSlug) {
          throw new Error('English article translation with a valid slug or title is required');
        }
        finalEnglishSlug = await disambiguateSharedArticleSlug(tx, {
          locales: Array.from(localesNeedingEnglishSlug),
          slug: desiredEnglishSlug,
          articleId,
          excludeArticleId: articleId,
        });
      }

      if (Array.isArray(body.translations)) {
        for (const t of translationInputs) {
          const finalSlug = resolveArticleTranslationSlug({
            locale: t.locale,
            englishSlug: finalEnglishSlug!,
          });
          const values = {
            title: t.title.trim(),
            slug: finalSlug,
            dek: t.dek || null,
            author: t.author || null,
          };
          const [existingTrans] = await tx
            .select()
            .from(articleTranslations)
            .where(
              and(eq(articleTranslations.articleId, articleId), eq(articleTranslations.locale, t.locale)),
            )
            .limit(1);
          let transId: number;
          if (existingTrans) {
            if (existingTrans.slug !== finalSlug) {
              await tx
                .insert(articleSlugHistory)
                .values({ articleId, locale: t.locale, oldSlug: existingTrans.slug })
                .onConflictDoNothing();
            }
            await tx.update(articleTranslations).set(values).where(eq(articleTranslations.id, existingTrans.id));
            transId = existingTrans.id;
          } else {
            const [inserted] = await tx
              .insert(articleTranslations)
              .values({ articleId, locale: t.locale, ...values })
              .returning({ id: articleTranslations.id });
            transId = inserted.id;
          }
          // Body lives only in article_translation_bodies (legacy column dropped in
          // 0007); upsert it keyed by the translation id.
          await tx
            .insert(articleTranslationBodies)
            .values({ articleTranslationId: transId, body: t.body || null })
            .onConflictDoUpdate({
              target: articleTranslationBodies.articleTranslationId,
              set: { body: t.body || null },
            });
        }

        const currentRows = await tx
          .select()
          .from(articleTranslations)
          .where(eq(articleTranslations.articleId, articleId));
        for (const row of currentRows) {
          const finalSlug = resolveArticleTranslationSlug({
            locale: row.locale,
            englishSlug: finalEnglishSlug!,
          });
          if (row.slug === finalSlug) continue;
          await tx
            .insert(articleSlugHistory)
            .values({ articleId, locale: row.locale, oldSlug: row.slug })
            .onConflictDoNothing();
          await tx
            .update(articleTranslations)
            .set({ slug: finalSlug })
            .where(eq(articleTranslations.id, row.id));
        }
      }

      if (Array.isArray(body.productIds)) {
        await tx.delete(articleProducts).where(eq(articleProducts.articleId, articleId));
        for (let i = 0; i < body.productIds.length; i++) {
          const pid = parseInt(body.productIds[i]);
          if (Number.isNaN(pid)) continue;
          await tx.insert(articleProducts).values({ articleId, productId: pid, displayOrder: i });
        }
      }

      return tx
        .select({ locale: articleTranslations.locale, slug: articleTranslations.slug })
        .from(articleTranslations)
        .where(eq(articleTranslations.articleId, articleId));
    });
  } catch (error) {
    console.error('Update article error:', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }

  // Bust ISR: old + new detail URLs (slug may have changed) and every
  // locale's journal index (EN fallback surfaces edits everywhere).
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
