import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb, withDbRetryFast } from '@/lib/db';
import { aboutPage, siteSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { ABOUT_VIDEO_SETTING_KEY } from '@/lib/site-settings-keys';

export async function GET(request: NextRequest) {
  const locale = new URL(request.url).searchParams.get('locale') || 'en';

  const db = getDb();
  let [about] = await withDbRetryFast(() =>
    db.select().from(aboutPage).where(eq(aboutPage.locale, locale)).limit(1),
  );

  if (!about && locale !== 'en') {
    [about] = await withDbRetryFast(() =>
      db.select().from(aboutPage).where(eq(aboutPage.locale, 'en')).limit(1),
    );
  }

  const [videoSetting] = await withDbRetryFast(() =>
    db.select().from(siteSettings).where(eq(siteSettings.key, ABOUT_VIDEO_SETTING_KEY)).limit(1),
  );

  return NextResponse.json({
    ...(about || { content: '', factorySize: '', employeeCount: '', annualCapacity: '' }),
    videoSlug: videoSetting?.value || '',
  });
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

  // Which published video plays on the About page. Empty string = automatic
  // factory-tour default. Global (not per-locale), so it lives in siteSettings.
  if (typeof body.videoSlug === 'string') {
    const videoSlug = body.videoSlug.trim();
    const [existingSetting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, ABOUT_VIDEO_SETTING_KEY))
      .limit(1);
    if (existingSetting) {
      await db.update(siteSettings)
        .set({ value: videoSlug, updatedAt: new Date().toISOString() })
        .where(eq(siteSettings.key, ABOUT_VIDEO_SETTING_KEY));
    } else {
      await db.insert(siteSettings).values({ key: ABOUT_VIDEO_SETTING_KEY, value: videoSlug });
    }
  }

  // About content shows on /about and the home facility/stats section.
  revalidatePath('/', 'layout');

  return NextResponse.json({ message: 'About page updated' });
}
