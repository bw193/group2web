import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { and, eq, ne } from 'drizzle-orm';
import { getDb, withDbRetryFast } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { getSession } from '@/lib/auth';
import { locales } from '@/i18n/config';
import { buildVideoUpdateValues, responseVideoRow } from '@/lib/video-admin';
import { pickLocalized } from '@/lib/video-utils';

function revalidateVideoSurfaces(slugs: string[] = []) {
  for (const loc of locales) {
    revalidatePath(`/${loc}/videos`);
    revalidatePath(`/${loc}/products/[slug]`, 'page');
    for (const slug of slugs) {
      if (slug) revalidatePath(`/${loc}/videos/${slug}`);
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const [row] = await withDbRetryFast(() => getDb().select().from(videos).where(eq(videos.id, id)).limit(1));
  if (!row) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }
  return NextResponse.json(responseVideoRow(row));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as any;
    const db = getDb();
    const [existing] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const values = buildVideoUpdateValues(existing, body);
    if (!pickLocalized(values.title, 'en') || !values.slug) {
      return NextResponse.json({ error: 'English title and slug are required' }, { status: 400 });
    }
    if (!pickLocalized(values.excerpt, 'en')) {
      return NextResponse.json({ error: 'English description is required' }, { status: 400 });
    }

    const clash = await db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.slug, values.slug), ne(videos.id, id)))
      .limit(1);
    if (clash.length > 0) {
      return NextResponse.json({ error: `Slug "${values.slug}" is already used by another video` }, { status: 409 });
    }

    const [updated] = await db.update(videos).set(values).where(eq(videos.id, id)).returning();
    revalidateVideoSurfaces([existing.slug, updated.slug]);
    return NextResponse.json(responseVideoRow(updated));
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const [existing] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  await db.delete(videos).where(eq(videos.id, id));
  revalidateVideoSurfaces([existing.slug]);
  return NextResponse.json({ message: 'Video deleted' });
}
