import 'server-only';

import { readFileSync } from 'node:fs';
import {
  aboutGallery,
  aboutPage,
  articleCategories,
  articleCategoryTranslations,
  articleProducts,
  articles,
  articleTranslationBodies,
  articleTranslations,
  banners,
  bannerTranslations,
  categoryTranslations,
  faqs,
  faqTranslations,
  productCategories,
  productImages,
  products,
  productSpecifications,
  productTranslations,
} from './db/schema';

export type AboutGalleryRow = typeof aboutGallery.$inferSelect;
export type AboutPageRow = typeof aboutPage.$inferSelect;
export type ArticleCategoryRow = typeof articleCategories.$inferSelect;
export type ArticleCategoryTranslationRow = typeof articleCategoryTranslations.$inferSelect;
export type ArticleProductRow = typeof articleProducts.$inferSelect;
export type ArticleRow = typeof articles.$inferSelect;
export type ArticleTranslationBodyRow = typeof articleTranslationBodies.$inferSelect;
export type ArticleTranslationRow = typeof articleTranslations.$inferSelect;
export type BannerRow = typeof banners.$inferSelect;
export type BannerTranslationRow = typeof bannerTranslations.$inferSelect;
export type CategoryTranslationRow = typeof categoryTranslations.$inferSelect;
export type FaqRow = typeof faqs.$inferSelect;
export type FaqTranslationRow = typeof faqTranslations.$inferSelect;
export type ProductCategoryRow = typeof productCategories.$inferSelect;
export type ProductImageRow = typeof productImages.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type ProductSpecificationRow = typeof productSpecifications.$inferSelect;
export type ProductTranslationRow = typeof productTranslations.$inferSelect;

export interface PublicDataSnapshotData {
  aboutGallery: AboutGalleryRow[];
  aboutPages: AboutPageRow[];
  articleCategories: ArticleCategoryRow[];
  articleCategoryTranslations: ArticleCategoryTranslationRow[];
  articleProducts: ArticleProductRow[];
  articleTranslationBodies: ArticleTranslationBodyRow[];
  articleTranslations: ArticleTranslationRow[];
  articles: ArticleRow[];
  bannerTranslations: BannerTranslationRow[];
  banners: BannerRow[];
  categoryTranslations: CategoryTranslationRow[];
  faqTranslations: FaqTranslationRow[];
  faqs: FaqRow[];
  productCategories: ProductCategoryRow[];
  productImages: ProductImageRow[];
  productSpecifications: ProductSpecificationRow[];
  productTranslations: ProductTranslationRow[];
  products: ProductRow[];
}

export interface PublicDataSnapshot {
  version: 1;
  generatedAt: string;
  counts: Record<keyof PublicDataSnapshotData, number>;
  data: PublicDataSnapshotData;
}

let snapshotCache: PublicDataSnapshot | null | undefined;

export function getPublicDataSnapshotPath(): string | null {
  return process.env.PUBLIC_DATA_SNAPSHOT_PATH || null;
}

export function isPublicDataSnapshotEnabled(): boolean {
  return Boolean(getPublicDataSnapshotPath());
}

export function getPublicDataSnapshot(): PublicDataSnapshot | null {
  const snapshotPath = getPublicDataSnapshotPath();
  if (!snapshotPath) return null;
  if (snapshotCache !== undefined) return snapshotCache;

  const raw = readFileSync(snapshotPath, 'utf8').replace(/^\uFEFF/, '');
  const parsed = JSON.parse(raw) as PublicDataSnapshot;
  if (parsed.version !== 1) {
    throw new Error(`Unsupported public data snapshot version: ${String(parsed.version)}`);
  }
  snapshotCache = parsed;
  return snapshotCache;
}
