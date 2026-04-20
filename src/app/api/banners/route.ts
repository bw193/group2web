import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { banners, bannerTranslations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const locale = new URL(request.url).searchParams.get('locale') || 'en';

  const db = getDb();
  const allBanners = await db.select().from(banners).orderBy(banners.displayOrder);

  const result = await Promise.all(
    allBanners.map(async (b) => {
      const [trans] = await db
        .select()
        .from(bannerTranslations)
        .where(and(eq(bannerTranslations.bannerId, b.id), eq(bannerTranslations.locale, locale)))
        .limit(1);

      return {
        ...b,
        title: trans?.title,
        subtitle: trans?.subtitle,
        ctaText: trans?.ctaText,
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
  const { imageUrl, displayOrder, isActive, ctaLink, translations } = body;

  if (!imageUrl) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
  }

  const db = getDb();
  const [banner] = await db.insert(banners).values({
    imageUrl,
    displayOrder: displayOrder || 0,
    isActive: isActive !== false,
    ctaLink: ctaLink || null,
    createdBy: session.userId,
  }).returning();

  if (translations && Array.isArray(translations)) {
    for (const t of translations) {
      await db.insert(bannerTranslations).values({
        bannerId: banner.id,
        locale: t.locale,
        title: t.title || null,
        subtitle: t.subtitle || null,
        ctaText: t.ctaText || null,
      });
    }
  }

  return NextResponse.json(banner, { status: 201 });
}
