import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { and, desc, eq } from 'drizzle-orm';
import { getDb, withDbRetryFast } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { getSession } from '@/lib/auth';
import { locales } from '@/i18n/config';
import { slugify } from '@/lib/utils';
import { durationFromInput, responseVideoRow, tagsFromInput } from '@/lib/video-admin';
import {
  buildEmbedUrl,
  getYouTubeThumbnail,
  normalizeLocalizedMap,
  normalizeVideoSourceType,
  normalizeVideoStatus,
  pickLocalized,
} from '@/lib/video-utils';

function revalidateVideoSurfaces(slugs: string[] = []) {
  for (const loc of locales) {
    revalidatePath(`/${loc}/videos`);
    revalidatePath(`/${loc}/products/[slug]`, 'page');
    for (const slug of slugs) {
      if (slug) revalidatePath(`/${loc}/videos/${slug}`);
    }
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rows = await withDbRetryFast(() =>
    getDb().select().from(videos).orderBy(desc(videos.publishedAt), desc(videos.createdAt)),
  );
  return NextResponse.json(rows.map(responseVideoRow));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as any;
    const title = normalizeLocalizedMap(body.title);
    const titleEn = pickLocalized(title, 'en');
    const excerpt = normalizeLocalizedMap(body.excerpt);
    const excerptEn = pickLocalized(excerpt, 'en');
    const slug = slugify(body.slug || titleEn);
    if (!titleEn || !slug) {
      return NextResponse.json({ error: 'English title and slug are required' }, { status: 400 });
    }
    if (!excerptEn) {
      return NextResponse.json({ error: 'English description is required' }, { status: 400 });
    }

    const db = getDb();
    const clash = await db.select({ id: videos.id }).from(videos).where(eq(videos.slug, slug)).limit(1);
    if (clash.length > 0) {
      return NextResponse.json({ error: `Slug "${slug}" is already used by another video` }, { status: 409 });
    }

    const sourceType = normalizeVideoSourceType(body.sourceType);
    const videoUrl = typeof body.videoUrl === 'string' && body.videoUrl.trim() ? body.videoUrl.trim() : null;
    const embedUrl =
      sourceType === 'embed'
        ? (typeof body.embedUrl === 'string' && body.embedUrl.trim() ? body.embedUrl.trim() : buildEmbedUrl(videoUrl))
        : (typeof body.embedUrl === 'string' && body.embedUrl.trim() ? body.embedUrl.trim() : null);
    const status = normalizeVideoStatus(body.status);
    const thumbnailUrl =
      typeof body.thumbnailUrl === 'string' && body.thumbnailUrl.trim()
        ? body.thumbnailUrl.trim()
        : sourceType === 'embed'
          ? getYouTubeThumbnail(videoUrl)
          : null;

    const [created] = await db
      .insert(videos)
      .values({
        slug,
        status,
        sourceType,
        videoUrl,
        embedUrl: embedUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        category: typeof body.category === 'string' && body.category.trim() ? body.category.trim() : null,
        tags: tagsFromInput(body.tags),
        durationSeconds: durationFromInput(body.durationSeconds),
        title,
        excerpt,
        body: normalizeLocalizedMap(body.body),
        seoTitle: normalizeLocalizedMap(body.seoTitle),
        seoDescription: normalizeLocalizedMap(body.seoDescription),
        publishedAt:
          status === 'published'
            ? body.publishedAt
              ? new Date(body.publishedAt).toISOString()
              : new Date().toISOString()
            : body.publishedAt
              ? new Date(body.publishedAt).toISOString()
              : null,
      })
      .returning();

    revalidateVideoSurfaces([created.slug]);
    return NextResponse.json(responseVideoRow(created), { status: 201 });
  } catch (error) {
    console.error('Create video error:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
