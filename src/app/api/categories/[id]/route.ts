import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { productCategories, categoryTranslations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const catId = parseInt(id);
  const body = await request.json() as any;

  const db = getDb();
  await db.update(productCategories)
    .set({
      parentId: body.parentId ?? null,
      imageUrl: body.imageUrl ?? null,
      displayOrder: body.displayOrder ?? 0,
      isActive: body.isActive ?? true,
    })
    .where(eq(productCategories.id, catId));

  if (body.translations && Array.isArray(body.translations)) {
    for (const t of body.translations) {
      const [existing] = await db.select().from(categoryTranslations)
        .where(and(eq(categoryTranslations.categoryId, catId), eq(categoryTranslations.locale, t.locale)))
        .limit(1);

      if (existing) {
        await db.update(categoryTranslations)
          .set({ name: t.name, slug: t.slug })
          .where(eq(categoryTranslations.id, existing.id));
      } else {
        await db.insert(categoryTranslations).values({
          categoryId: catId, locale: t.locale, name: t.name, slug: t.slug,
        });
      }
    }
  }

  return NextResponse.json({ message: 'Category updated' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  await db.delete(productCategories).where(eq(productCategories.id, parseInt(id)));
  return NextResponse.json({ message: 'Category deleted' });
}
