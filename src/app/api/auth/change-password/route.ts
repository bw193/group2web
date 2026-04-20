import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { compareSync, hashSync } from 'bcryptjs';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json() as any;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Invalid input. New password must be at least 8 characters.' }, { status: 400 });
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user || !compareSync(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  await db.update(users)
    .set({
      passwordHash: hashSync(newPassword, 12),
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ message: 'Password changed successfully' });
}
