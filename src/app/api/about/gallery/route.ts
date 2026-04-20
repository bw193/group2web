import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { aboutGallery } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const VALID_TYPES = new Set(['factory', 'certification', 'team', 'product']);

// GET ?type=factory|certification (defaults to all)
export async function GET(request: NextRequest) {
  const type = new URL(request.url).searchParams.get('type');
  const db = getDb();

  const rows = type
    ? await db
        .select()
        .from(aboutGallery)
        .where(eq(aboutGallery.imageType, type))
        .orderBy(aboutGallery.displayOrder)
    : await db.select().from(aboutGallery).orderBy(aboutGallery.displayOrder);

  return NextResponse.json(rows);
}

// POST { imageUrl, imageType, displayOrder? }
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = (await request.json()) as { imageUrl?: string; imageType?: string; displayOrder?: number };

  if (!body.imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
  if (!body.imageType || !VALID_TYPES.has(body.imageType)) {
    return NextResponse.json({ error: 'imageType must be one of: factory, certification, team, product' }, { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .insert(aboutGallery)
    .values({
      imageUrl: body.imageUrl,
      imageType: body.imageType,
      displayOrder: body.displayOrder ?? 0,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
