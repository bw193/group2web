import type { videos } from '@/lib/db/schema';
import { slugify } from '@/lib/utils';
import {
  buildEmbedUrl,
  getYouTubeThumbnail,
  mergeLocalizedMap,
  normalizeLocalizedMap,
  normalizeVideoSourceType,
  normalizeVideoStatus,
  pickLocalized,
  videoRowToPost,
} from '@/lib/video-utils';

type VideoRow = typeof videos.$inferSelect;

export function tagsFromInput(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => (typeof tag === 'string' ? tag.trim() : '')).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

export function durationFromInput(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function responseVideoRow(row: VideoRow) {
  const post = videoRowToPost(row);
  return {
    ...row,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    tags: post.tags,
    titleText: pickLocalized(post.title, 'en') || post.slug,
    excerptText: pickLocalized(post.excerpt, 'en'),
  };
}

export function buildVideoUpdateValues(existing: VideoRow, body: any) {
  const nextTitle = body.title === undefined ? normalizeLocalizedMap(existing.title) : mergeLocalizedMap(existing.title, body.title);
  const titleEn = pickLocalized(nextTitle, 'en');
  const slug = slugify(body.slug || existing.slug || titleEn);
  const sourceType = body.sourceType === undefined ? normalizeVideoSourceType(existing.sourceType) : normalizeVideoSourceType(body.sourceType);
  const videoUrl =
    body.videoUrl === undefined
      ? existing.videoUrl
      : typeof body.videoUrl === 'string' && body.videoUrl.trim()
        ? body.videoUrl.trim()
        : null;
  const embedUrl =
    body.embedUrl === undefined
      ? sourceType === 'embed'
        ? existing.embedUrl || buildEmbedUrl(videoUrl)
        : existing.embedUrl
      : typeof body.embedUrl === 'string' && body.embedUrl.trim()
        ? body.embedUrl.trim()
        : sourceType === 'embed'
          ? buildEmbedUrl(videoUrl)
          : null;

  return {
    slug,
    status: body.status === undefined ? normalizeVideoStatus(existing.status) : normalizeVideoStatus(body.status),
    sourceType,
    videoUrl,
    embedUrl: embedUrl || null,
    thumbnailUrl:
      body.thumbnailUrl === undefined
        ? existing.thumbnailUrl
        : typeof body.thumbnailUrl === 'string' && body.thumbnailUrl.trim()
          ? body.thumbnailUrl.trim()
          : sourceType === 'embed'
            ? getYouTubeThumbnail(videoUrl)
            : null,
    category:
      body.category === undefined
        ? existing.category
        : typeof body.category === 'string' && body.category.trim()
          ? body.category.trim()
          : null,
    tags: body.tags === undefined ? existing.tags || [] : tagsFromInput(body.tags),
    durationSeconds: body.durationSeconds === undefined ? existing.durationSeconds : durationFromInput(body.durationSeconds),
    title: nextTitle,
    excerpt: body.excerpt === undefined ? normalizeLocalizedMap(existing.excerpt) : mergeLocalizedMap(existing.excerpt, body.excerpt),
    body: body.body === undefined ? normalizeLocalizedMap(existing.body) : mergeLocalizedMap(existing.body, body.body),
    seoTitle: body.seoTitle === undefined ? normalizeLocalizedMap(existing.seoTitle) : mergeLocalizedMap(existing.seoTitle, body.seoTitle),
    seoDescription:
      body.seoDescription === undefined
        ? normalizeLocalizedMap(existing.seoDescription)
        : mergeLocalizedMap(existing.seoDescription, body.seoDescription),
    publishedAt:
      body.publishedAt === undefined
        ? existing.publishedAt
        : body.publishedAt
          ? new Date(body.publishedAt).toISOString()
          : null,
    updatedAt: new Date().toISOString(),
  };
}
