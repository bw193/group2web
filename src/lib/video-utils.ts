import type { ProductCardData } from '@/lib/public-data';

export type LocalizedMap = Record<string, string>;
export type VideoStatus = 'draft' | 'published';
export type VideoSourceType = 'embed' | 'upload' | 'direct';

export interface VideoPost {
  id: string;
  slug: string;
  status: VideoStatus;
  sourceType: VideoSourceType;
  videoUrl: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  tags: string[];
  durationSeconds: number | null;
  title: LocalizedMap;
  excerpt: LocalizedMap;
  body: LocalizedMap;
  seoTitle: LocalizedMap;
  seoDescription: LocalizedMap;
  publishedAt: string | null;
  createdAt?: string | null;
  updatedAt: string | null;
}

export interface LocalizedVideoPost {
  id: string;
  slug: string;
  status: VideoStatus;
  sourceType: VideoSourceType;
  videoUrl: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  tags: string[];
  durationSeconds: number | null;
  publishedAt: string | null;
  updatedAt: string | null;
  title: string;
  excerpt: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
  searchText: string;
}

export interface VideoListItem {
  id: string;
  slug: string;
  sourceType: VideoSourceType;
  videoUrl: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  tags: string[];
  durationSeconds: number | null;
  publishedAt: string | null;
  title: string;
  excerpt: string;
  searchText: string;
}

export interface ProductRecommendationInput {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  modelNumber?: string | null;
  tags?: string[] | null;
  imageUrl?: string | null;
}

export type ProductRecommendationCandidate = ProductRecommendationInput & {
  card: ProductCardData;
};

const DIRECT_VIDEO_RE = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

const STOPWORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'into',
  'our',
  'your',
  'that',
  'this',
  'mirror',
  'mirrors',
  'video',
  'videos',
  'chengtai',
  'bolen',
]);

export function normalizeVideoStatus(value: unknown): VideoStatus {
  return value === 'published' ? 'published' : 'draft';
}

export function normalizeVideoSourceType(value: unknown): VideoSourceType {
  return value === 'upload' || value === 'direct' || value === 'embed' ? value : 'embed';
}

export function normalizeLocalizedMap(value: unknown): LocalizedMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: LocalizedMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'string' && raw.trim()) out[key] = raw.trim();
  }
  return out;
}

export function pickLocalized(field: LocalizedMap | null | undefined, locale: string): string {
  if (!field) return '';
  return field[locale] || field.en || Object.values(field).find(Boolean) || '';
}

export function mergeLocalizedMap(existing: unknown, incoming: unknown): LocalizedMap {
  return { ...normalizeLocalizedMap(existing), ...normalizeLocalizedMap(incoming) };
}

export function formatVideoDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 1) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hours}:${String(rem).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function isDirectVideoUrl(url: string | null | undefined): boolean {
  return !!url && DIRECT_VIDEO_RE.test(url);
}

export function buildEmbedUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts)\/([^/?#]+)/)?.[1] || '';
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : '';
    }
  } catch {
    return '';
  }
  return '';
}

export function getYouTubeThumbnail(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const id =
      host === 'youtu.be'
        ? u.pathname.split('/').filter(Boolean)[0]
        : host.endsWith('youtube.com')
          ? u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts)\/([^/?#]+)/)?.[1] || ''
          : '';
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  } catch {
    return '';
  }
}

export function getVideoPlayback(video: {
  sourceType: VideoSourceType;
  videoUrl?: string | null;
  embedUrl?: string | null;
}): { kind: 'embed' | 'video' | 'missing'; src: string } {
  if (video.sourceType === 'embed') {
    const embed = video.embedUrl || buildEmbedUrl(video.videoUrl);
    if (embed) return { kind: 'embed', src: embed };
  }
  if ((video.sourceType === 'upload' || video.sourceType === 'direct') && video.videoUrl) {
    return { kind: 'video', src: video.videoUrl };
  }
  if (isDirectVideoUrl(video.videoUrl)) return { kind: 'video', src: video.videoUrl || '' };
  const embed = video.embedUrl || buildEmbedUrl(video.videoUrl);
  return embed ? { kind: 'embed', src: embed } : { kind: 'missing', src: '' };
}

export function videoRowToPost(row: {
  id: string;
  slug: string;
  status: string;
  sourceType: string;
  videoUrl: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  tags: string[] | null;
  durationSeconds: number | null;
  title: unknown;
  excerpt: unknown;
  body: unknown;
  seoTitle: unknown;
  seoDescription: unknown;
  publishedAt: string | null;
  createdAt?: string | null;
  updatedAt: string | null;
}): VideoPost {
  return {
    id: row.id,
    slug: row.slug,
    status: normalizeVideoStatus(row.status),
    sourceType: normalizeVideoSourceType(row.sourceType),
    videoUrl: row.videoUrl ?? null,
    embedUrl: row.embedUrl ?? null,
    thumbnailUrl: row.thumbnailUrl ?? null,
    category: row.category ?? null,
    tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
    durationSeconds: row.durationSeconds ?? null,
    title: normalizeLocalizedMap(row.title),
    excerpt: normalizeLocalizedMap(row.excerpt),
    body: normalizeLocalizedMap(row.body),
    seoTitle: normalizeLocalizedMap(row.seoTitle),
    seoDescription: normalizeLocalizedMap(row.seoDescription),
    publishedAt: row.publishedAt ?? null,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

export function localizeVideo(post: VideoPost, locale: string): LocalizedVideoPost {
  return {
    id: post.id,
    slug: post.slug,
    status: post.status,
    sourceType: post.sourceType,
    videoUrl: post.videoUrl,
    embedUrl: post.embedUrl,
    thumbnailUrl: post.thumbnailUrl,
    category: post.category,
    tags: post.tags,
    durationSeconds: post.durationSeconds,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    title: pickLocalized(post.title, locale),
    excerpt: pickLocalized(post.excerpt, locale),
    body: pickLocalized(post.body, locale),
    seoTitle: pickLocalized(post.seoTitle, locale) || undefined,
    seoDescription: pickLocalized(post.seoDescription, locale) || undefined,
    searchText: rawVideoSearchText(post),
  };
}

export function toVideoListItem(post: VideoPost, locale: string): VideoListItem {
  return {
    id: post.id,
    slug: post.slug,
    sourceType: post.sourceType,
    videoUrl: post.videoUrl,
    embedUrl: post.embedUrl,
    thumbnailUrl: post.thumbnailUrl,
    category: post.category,
    tags: post.tags,
    durationSeconds: post.durationSeconds,
    publishedAt: post.publishedAt,
    title: pickLocalized(post.title, locale),
    excerpt: pickLocalized(post.excerpt, locale),
    searchText: rawVideoSearchText(post),
  };
}

function textFromLocalized(field: LocalizedMap | string | null | undefined): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return Object.values(field).filter(Boolean).join(' ');
}

function tokenize(...values: Array<string | null | undefined>): Set<string> {
  const words = values
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .split(/[\s-]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
  return new Set(words);
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let score = 0;
  a.forEach((token) => {
    if (b.has(token)) score += 1;
  });
  return score;
}

function scoreProductForVideo(video: LocalizedVideoPost | VideoListItem, product: ProductRecommendationInput): number {
  const videoTokens = tokenize(video.title, video.excerpt, video.category || '', video.searchText || '', ...(video.tags || []));
  const productTokens = tokenize(
    product.title,
    product.description || '',
    product.category || '',
    product.modelNumber || '',
    ...(product.tags || []),
  );
  let score = overlapScore(videoTokens, productTokens);
  if (video.category && product.category && video.category.toLowerCase() === product.category.toLowerCase()) {
    score += 8;
  }
  const tagText = (video.tags || []).join(' ').toLowerCase();
  if (product.category && tagText.includes(product.category.toLowerCase())) score += 4;
  score += overlapScore(tokenize(product.title), tokenize(tagText)) * 2;
  return score;
}

function scoreVideoForVideo(video: LocalizedVideoPost | VideoListItem, candidate: VideoListItem): number {
  const videoTokens = tokenize(video.title, video.excerpt, video.category || '', video.searchText || '', ...(video.tags || []));
  const candidateTokens = tokenize(candidate.title, candidate.excerpt, candidate.category || '', candidate.searchText || '', ...(candidate.tags || []));
  let score = overlapScore(videoTokens, candidateTokens);
  if (video.category && candidate.category && video.category.toLowerCase() === candidate.category.toLowerCase()) score += 6;

  const videoTags = new Set((video.tags || []).map((tag) => tag.toLowerCase()));
  for (const tag of candidate.tags || []) {
    if (videoTags.has(tag.toLowerCase())) score += 3;
  }
  return score;
}

export function recommendProductsForVideo<T extends ProductRecommendationInput>(
  video: LocalizedVideoPost | VideoListItem,
  products: T[],
  limit = 4,
): T[] {
  return products
    .map((product, index) => ({ product, score: scoreProductForVideo(video, product), index }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.product);
}

export function recommendVideosForVideo<T extends VideoListItem>(
  video: LocalizedVideoPost | VideoListItem,
  videoItems: T[],
  limit = 3,
): T[] {
  return videoItems
    .map((candidate, index) => ({ candidate, score: scoreVideoForVideo(video, candidate), index }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.candidate);
}

export function recommendVideosForProduct<T extends VideoListItem>(
  product: ProductRecommendationInput,
  videoItems: T[],
  limit = 3,
): T[] {
  return videoItems
    .map((video, index) => ({ video, score: scoreProductForVideo(video, product), index }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.video);
}

export function rawVideoSearchText(video: VideoPost): string {
  return [
    textFromLocalized(video.title),
    textFromLocalized(video.excerpt),
    textFromLocalized(video.body),
    video.category || '',
    ...(video.tags || []),
  ].join(' ');
}

export function videoExcerpt(html: string | null | undefined, max = 300): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
