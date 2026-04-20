import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { aboutPage } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const locale = new URL(request.url).searchParams.get('locale') || 'en';

  const db = getDb();
  let [about] = await db.select().from(aboutPage).where(eq(aboutPage.locale, locale)).limit(1);

  if (!about && locale !== 'en') {
    [about] = await db.select().from(aboutPage).where(eq(aboutPage.locale, 'en')).limit(1);
  }

  return NextResponse.json(about || { content: '', factorySize: '', employeeCount: '', annualCapacity: '' });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json() as any;
  const locale = body.locale || 'en';

  const db = getDb();
  const [existing] = await db.select().from(aboutPage).where(eq(aboutPage.locale, locale)).limit(1);

  if (existing) {
    await db.update(aboutPage)
      .set({
        content: body.content,
        factorySize: body.factorySize,
        employeeCount: body.employeeCount,
        annualCapacity: body.annualCapacity,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(aboutPage.locale, locale));
  } else {
    await db.insert(aboutPage).values({
      locale,
      content: body.content,
      factorySize: body.factorySize,
      employeeCount: body.employeeCount,
      annualCapacity: body.annualCapacity,
    });
  }

  return NextResponse.json({ message: 'About page updated' });
}
