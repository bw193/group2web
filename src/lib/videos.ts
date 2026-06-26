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

function getSnapshot(): PublicDataSnapshot | null {
  return getPublicDataSnapshot();
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

function snapshotVideos(snapshot: PublicDataSnapshot): VideoPost[] {
  return snapshot.data.videos.map(videoRowToPost);
}

export async function getVideosIndexData(locale: string): Promise<VideosIndexData> {
  const snapshot = getSnapshot();
  const posts = snapshot
    ? snapshotVideos(snapshot)
    : (await getDb().select().from(videos).where(eq(videos.status, 'published')).orderBy(desc(videos.publishedAt))).map(videoRowToPost);

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
  if (snapshot) {
    post = snapshotVideos(snapshot).find((video) => video.slug === slug && video.status === 'published') ?? null;
  } else {
    const [row] = await getDb()
      .select()
      .from(videos)
      .where(and(eq(videos.slug, slug), eq(videos.status, 'published')))
      .limit(1);
    post = row ? videoRowToPost(row) : null;
  }

  if (!post) return null;

  const video = localizeVideo(post, locale);
  const allVideos = snapshot
    ? snapshotVideos(snapshot)
    : (await getDb().select().from(videos).where(eq(videos.status, 'published')).orderBy(desc(videos.publishedAt))).map(videoRowToPost);
  const relatedVideos = allVideos
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
  const snapshot = getSnapshot();
  const rows = snapshot
    ? snapshotVideos(snapshot).filter((video) => video.status === 'published')
    : (await getDb().select().from(videos).where(eq(videos.status, 'published'))).map(videoRowToPost);
  return rows.flatMap((video) => locales.map((locale) => ({ locale, slug: video.slug })));
}

export async function getVideoSitemapRows(): Promise<VideoSitemapRow[]> {
  const snapshot = getSnapshot();
  const rows = snapshot
    ? snapshotVideos(snapshot)
    : (await getDb().select().from(videos)).map(videoRowToPost);
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
