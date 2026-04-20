import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { aboutGallery } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = (await request.json()) as { displayOrder?: number; imageType?: string };

  const update: Record<string, unknown> = {};
  if (typeof body.displayOrder === 'number') update.displayOrder = body.displayOrder;
  if (typeof body.imageType === 'string') update.imageType = body.imageType;

  const db = getDb();
  await db.update(aboutGallery).set(update).where(eq(aboutGallery.id, id));
  return NextResponse.json({ message: 'Gallery item updated' });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const db = getDb();
  await db.delete(aboutGallery).where(eq(aboutGallery.id, id));
  return NextResponse.json({ message: 'Gallery item deleted' });
}
