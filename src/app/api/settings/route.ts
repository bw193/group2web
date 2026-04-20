import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const allSettings = await db.select().from(siteSettings);
  const result: Record<string, string> = {};
  for (const s of allSettings) {
    result[s.key] = s.value || '';
  }
  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json() as any;
  const db = getDb();

  for (const [key, value] of Object.entries(body)) {
    const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    if (existing) {
      await db.update(siteSettings)
        .set({ value: String(value), updatedAt: new Date().toISOString() })
        .where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value: String(value) });
    }
  }

  return NextResponse.json({ message: 'Settings updated' });
}
