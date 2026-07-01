import 'server-only';

import { and, desc, eq, inArray } from 'drizzle-orm';
import { defaultLocale, locales } from '@/i18n/config';
import { getDb } from '@/lib/db';
import {
  categoryTranslations,
  productCategories,
  productImages,
  products,
  productTranslations,
  videos,
} from '@/lib/db/schema';
import { getPublicDataSnapshot } from '@/lib/public-data-snapshot';
import type {
  CategoryTranslationRow,
  ProductCategoryRow,
  ProductImageRow,
  ProductRow,
  ProductTranslationRow,
  PublicDataSnapshot,
} from '@/lib/public-data-snapshot';
import type { ProductCardData } from '@/lib/public-data';
import {
  localizeVideo,
  recommendProductsForVideo,
  recommendVideosForVideo,
  toVideoListItem,
  videoRowToPost,
  type LocalizedVideoPost,
  type ProductRecommendationCandidate,
  type VideoListItem,
  type VideoPost,
} from '@/lib/video-utils';

export interface VideosIndexData {
  videos: VideoListItem[];
}

export interface VideoDetailData {
  video: LocalizedVideoPost;
  relatedProducts: ProductCardData[];
  relatedVideos: VideoListItem[];
}

export interface VideoSitemapRow {
  locale: string;
  slug: string;
  videoId: string;
  updatedAt: string;
  status: string;
}

const videoListColumns = {
  id: videos.id,
  slug: videos.slug,
  status: videos.status,
  sourceType: videos.sourceType,
  videoUrl: videos.videoUrl,
  embedUrl: videos.embedUrl,
  thumbnailUrl: videos.thumbnailUrl,
  category: videos.category,
  tags: videos.tags,
  durationSeconds: videos.durationSeconds,
  title: videos.title,
  excerpt: videos.excerpt,
  publishedAt: videos.publishedAt,
  createdAt: videos.createdAt,
  updatedAt: videos.updatedAt,
} as const;

const videoDetailColumns = {
  ...videoListColumns,
  body: videos.body,
  seoTitle: videos.seoTitle,
  seoDescription: videos.seoDescription,
} as const;

type VideoListRow = {
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
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function getSnapshot(): PublicDataSnapshot | null {
  return getPublicDataSnapshot();
}

function liveVideoDbAllowed(): boolean {
  return process.env.PUBLIC_DATA_NO_LIVE_DB !== '1';
}

function byVideoDateDesc(a: VideoPost, b: VideoPost) {
  const aTime = new Date(a.publishedAt || a.createdAt || 0).getTime();
  const bTime = new Date(b.publishedAt || b.createdAt || 0).getTime();
  return bTime - aTime || a.slug.localeCompare(b.slug);
}

function categoryOptionsFromRows(
  cats: ProductCategoryRow[],
  translations: CategoryTranslationRow[],
  locale: string,
): Map<number, string> {
  const transMap = new Map(
    translations.filter((t) => t.locale === locale).map((t) => [t.categoryId, t.name]),
  );
  const transEnMap = new Map(
    translations.filter((t) => t.locale === defaultLocale).map((t) => [t.categoryId, t.name]),
  );
  return new Map(cats.map((cat) => [cat.id, transMap.get(cat.id) || transEnMap.get(cat.id) || `Category ${cat.id}`]));
}

function primaryImageMap(images: ProductImageRow[]) {
  const map = new Map<number, ProductImageRow>();
  for (const img of images) {
    const existing = map.get(img.productId);
    if (!existing || (img.isPrimary && !existing.isPrimary)) map.set(img.productId, img);
  }
  return map;
}

function parseProductTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === 'string') : [];
  } catch {
    return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
}

function productCandidatesFromRows(
  productRows: ProductRow[],
  translations: ProductTranslationRow[],
  images: ProductImageRow[],
  categoriesById: Map<number, string>,
  locale: string,
): ProductRecommendationCandidate[] {
  const transMap = new Map(translations.filter((t) => t.locale === locale).map((t) => [t.productId, t]));
  const transEnMap = new Map(translations.filter((t) => t.locale === defaultLocale).map((t) => [t.productId, t]));
  const imgMap = primaryImageMap(images);

  return productRows.flatMap((p) => {
    const t = transMap.get(p.id) || transEnMap.get(p.id);
    if (!t) return [];
    const imageUrl = imgMap.get(p.id)?.imageUrl || null;
    const card: ProductCardData = {
      id: p.id,
      name: t.name,
      slug: t.slug,
      shortDescription: t.shortDescription,
      modelNumber: p.modelNumber,
      imageUrl,
      isFeatured: p.isFeatured,
      categoryId: p.categoryId,
    };
    return [
      {
        id: String(p.id),
        title: t.name,
        description: [t.shortDescription, t.fullDescription].filter(Boolean).join(' '),
        category: p.categoryId ? categoriesById.get(p.categoryId) || null : null,
        modelNumber: p.modelNumber,
        tags: parseProductTags(p.tags),
        imageUrl,
        card,
      },
    ];
  });
}

function videoListRowToPost(row: VideoListRow): VideoPost {
  return videoRowToPost({
    ...row,
    body: {},
    seoTitle: {},
    seoDescription: {},
  });
}

async function getPublishedVideoPosts(limit?: number): Promise<VideoPost[]> {
  if (!liveVideoDbAllowed()) {
    const snapshot = getSnapshot();
    const posts = snapshot ? snapshot.data.videos.map(videoRowToPost) : [];
    const sorted = posts.filter((video) => video.status === 'published').sort(byVideoDateDesc);
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  }

  const db = getDb();
  const rows = limit
    ? await db
        .select(videoListColumns)
        .from(videos)
        .where(eq(videos.status, 'published'))
        .orderBy(desc(videos.publishedAt), desc(videos.createdAt))
        .limit(limit)
    : await db
        .select(videoListColumns)
        .from(videos)
        .where(eq(videos.status, 'published'))
        .orderBy(desc(videos.publishedAt), desc(videos.createdAt));
  return rows.map(videoListRowToPost);
}

export async function getVideosIndexData(locale: string): Promise<VideosIndexData> {
  const posts = await getPublishedVideoPosts(200);

  const list = posts
    .filter((video) => video.status === 'published')
    .sort(byVideoDateDesc)
    .map((video) => toVideoListItem(video, locale))
    .filter((video) => video.title);

  return {
    videos: list,
  };
}

export async function getVideoDetailData(locale: string, slug: string): Promise<VideoDetailData | null> {
  const snapshot = getSnapshot();
  let post: VideoPost | null = null;

  if (liveVideoDbAllowed()) {
    const [row] = await getDb()
      .select(videoDetailColumns)
      .from(videos)
      .where(and(eq(videos.slug, slug), eq(videos.status, 'published')))
      .limit(1);
    post = row ? videoRowToPost(row) : null;
  } else {
    post = snapshot?.data.videos.map(videoRowToPost).find((video) => video.slug === slug && video.status === 'published') ?? null;
  }

  if (!post) return null;

  const video = localizeVideo(post, locale);
  const relatedVideos = (await getPublishedVideoPosts(50))
    .filter((item) => item.status === 'published' && item.id !== post.id)
    .sort(byVideoDateDesc)
    .map((item) => toVideoListItem(item, locale))
    .filter((item) => item.title);

  let productCandidates: ProductRecommendationCandidate[] = [];
  if (snapshot) {
    const activeProducts = snapshot.data.products.filter((p) => p.isActive);
    const activeCats = snapshot.data.productCategories.filter((c) => c.isActive);
    const categoryMap = categoryOptionsFromRows(activeCats, snapshot.data.categoryTranslations, locale);
    productCandidates = productCandidatesFromRows(
      activeProducts,
      snapshot.data.productTranslations,
      snapshot.data.productImages,
      categoryMap,
      locale,
    );
  } else {
    const db = getDb();
    const activeProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .limit(500);
    const productIds = activeProducts.map((p) => p.id);
    const categoryIds = activeProducts.map((p) => p.categoryId).filter((id): id is number => typeof id === 'number');
    const allTrans = productIds.length
      ? await db
          .select()
          .from(productTranslations)
          .where(
            and(
              inArray(productTranslations.productId, productIds),
              inArray(productTranslations.locale, locale === defaultLocale ? [defaultLocale] : [locale, defaultLocale]),
            ),
          )
      : [];
    const imgs = productIds.length ? await db.select().from(productImages).where(inArray(productImages.productId, productIds)) : [];
    const cats = categoryIds.length
      ? await db.select().from(productCategories).where(inArray(productCategories.id, categoryIds))
      : [];
    const catTrans = categoryIds.length
      ? await db.select().from(categoryTranslations).where(inArray(categoryTranslations.categoryId, categoryIds))
      : [];
    productCandidates = productCandidatesFromRows(
      activeProducts,
      allTrans,
      imgs,
      categoryOptionsFromRows(cats, catTrans, locale),
      locale,
    );
  }

  return {
    video,
    relatedProducts: recommendProductsForVideo(video, productCandidates, 4).map((candidate) => candidate.card),
    relatedVideos: recommendVideosForVideo(video, relatedVideos, 3),
  };
}

export async function getVideoStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  // Keep video detail pages on-demand like a lightweight ISR surface. This
  // avoids adding 7 prerendered pages per CMS video to the production build.
  return [];
}

export async function getVideoSitemapRows(): Promise<VideoSitemapRow[]> {
  if (!liveVideoDbAllowed()) {
    const snapshot = getSnapshot();
    const rows = snapshot ? snapshot.data.videos.map(videoRowToPost) : [];
    return rows.flatMap((video) =>
      locales.map((locale) => ({
        locale,
        slug: video.slug,
        videoId: video.id,
        updatedAt: video.updatedAt || video.publishedAt || new Date().toISOString(),
        status: video.status,
      })),
    );
  }

  const rows = await getDb()
    .select({
      id: videos.id,
      slug: videos.slug,
      status: videos.status,
      publishedAt: videos.publishedAt,
      updatedAt: videos.updatedAt,
    })
    .from(videos)
    .where(eq(videos.status, 'published'));
  return rows.flatMap((video) =>
    locales.map((locale) => ({
      locale,
      slug: video.slug,
      videoId: video.id,
      updatedAt: video.updatedAt || video.publishedAt || new Date().toISOString(),
      status: video.status,
    })),
  );
}
