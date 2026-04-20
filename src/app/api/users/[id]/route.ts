import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  const body = await request.json() as any;

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.role) updates.role = body.role;
  updates.updatedAt = new Date().toISOString();

  const db = getDb();
  await db.update(users).set(updates).where(eq(users.id, userId));

  return NextResponse.json({ message: 'User updated' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  if (userId === session.userId) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const db = getDb();
  await db.delete(users).where(eq(users.id, userId));
  return NextResponse.json({ message: 'User deleted' });
}
