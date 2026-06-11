import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb, withDbRetry } from '@/lib/db';
import { productCategories, categoryTranslations } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const locale = new URL(request.url).searchParams.get('locale') || 'en';

  const db = getDb();
  // Batched sequential reads instead of up to two queries per category: N
  // simultaneous queries force the pool to open fresh connections, which is
  // exactly what stalls on the long-haul dev link.
  const categories = await withDbRetry(() =>
    db
      .select()
      .from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(productCategories.displayOrder),
  );
  if (categories.length === 0) return NextResponse.json([]);
  const catIds = categories.map((c) => c.id);

  const trans = await withDbRetry(() =>
    db
      .select()
      .from(categoryTranslations)
      .where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, locale))),
  );
  const transEn =
    locale === 'en'
      ? []
      : await withDbRetry(() =>
          db
            .select()
            .from(categoryTranslations)
            .where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, 'en'))),
        );

  const transMap = new Map(trans.map((t) => [t.categoryId, t]));
  const transEnMap = new Map(transEn.map((t) => [t.categoryId, t]));

  const result = categories.map((cat) => {
    const t = transMap.get(cat.id) || transEnMap.get(cat.id);
    return {
      id: cat.id,
      name: t?.name || `Category ${cat.id}`,
      slug: t?.slug || `category-${cat.id}`,
      parentId: cat.parentId,
      imageUrl: cat.imageUrl,
      displayOrder: cat.displayOrder,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json() as any;
  const { parentId, imageUrl, displayOrder, translations } = body;

  const db = getDb();
  const [category] = await db.insert(productCategories).values({
    parentId: parentId || null,
    imageUrl: imageUrl || null,
    displayOrder: displayOrder || 0,
    isActive: true,
  }).returning();

  if (translations && Array.isArray(translations)) {
    for (const t of translations) {
      await db.insert(categoryTranslations).values({
        categoryId: category.id,
        locale: t.locale,
        name: t.name,
        slug: t.slug,
      });
    }
  }

  // Categories appear on the home grid, listing filters, and contact form.
  revalidatePath('/', 'layout');

  return NextResponse.json(category, { status: 201 });
}
