import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { inquiries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json() as any;

  const updates: Record<string, unknown> = {};
  if (body.isRead !== undefined) updates.isRead = body.isRead;
  if (body.isReplied !== undefined) updates.isReplied = body.isReplied;

  if (Object.keys(updates).length > 0) {
    const db = getDb();
    await db.update(inquiries).set(updates).where(eq(inquiries.id, parseInt(id)));
  }

  return NextResponse.json({ message: 'Inquiry updated' });
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
  await db.delete(inquiries).where(eq(inquiries.id, parseInt(id)));
  return NextResponse.json({ message: 'Inquiry deleted' });
}
