import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { productCategories, categoryTranslations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const locale = new URL(request.url).searchParams.get('locale') || 'en';

  const db = getDb();
  const categories = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.isActive, true))
    .orderBy(productCategories.displayOrder);

  const result = await Promise.all(
    categories.map(async (cat) => {
      let transRows = await db
        .select()
        .from(categoryTranslations)
        .where(and(eq(categoryTranslations.categoryId, cat.id), eq(categoryTranslations.locale, locale)))
        .limit(1);

      if (!transRows[0] && locale !== 'en') {
        transRows = await db
          .select()
          .from(categoryTranslations)
          .where(and(eq(categoryTranslations.categoryId, cat.id), eq(categoryTranslations.locale, 'en')))
          .limit(1);
      }
      const trans = transRows[0];

      return {
        id: cat.id,
        name: trans?.name || `Category ${cat.id}`,
        slug: trans?.slug || `category-${cat.id}`,
        parentId: cat.parentId,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
      };
    })
  );

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

  return NextResponse.json(category, { status: 201 });
}
