import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { banners, bannerTranslations } from '@/lib/db/schema';
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
  const bannerId = parseInt(id);
  const body = await request.json() as any;

  const db = getDb();
  await db.update(banners)
    .set({
      imageUrl: body.imageUrl,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
      ctaLink: body.ctaLink,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(banners.id, bannerId));

  if (body.translations && Array.isArray(body.translations)) {
    for (const t of body.translations) {
      const [existing] = await db.select().from(bannerTranslations)
        .where(and(eq(bannerTranslations.bannerId, bannerId), eq(bannerTranslations.locale, t.locale)))
        .limit(1);

      if (existing) {
        await db.update(bannerTranslations)
          .set({ title: t.title, subtitle: t.subtitle, ctaText: t.ctaText })
          .where(eq(bannerTranslations.id, existing.id));
      } else {
        await db.insert(bannerTranslations).values({
          bannerId, locale: t.locale, title: t.title, subtitle: t.subtitle, ctaText: t.ctaText,
        });
      }
    }
  }

  return NextResponse.json({ message: 'Banner updated' });
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
  await db.delete(banners).where(eq(banners.id, parseInt(id)));
  return NextResponse.json({ message: 'Banner deleted' });
}
