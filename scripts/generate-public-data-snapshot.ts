import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvConfig } from '@next/env';
import { getDb } from '../src/lib/db';
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
  videos,
} from '../src/lib/db/schema';
import type { PublicDataSnapshot, PublicDataSnapshotData } from '../src/lib/public-data-snapshot';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
export const DEFAULT_PUBLIC_DATA_SNAPSHOT_PATH = resolve(PROJECT_ROOT, '.build-cache', 'public-data.json');

loadEnvConfig(PROJECT_ROOT);

function countsFor(data: PublicDataSnapshotData): PublicDataSnapshot['counts'] {
  return Object.fromEntries(
    Object.entries(data).map(([key, rows]) => [key, rows.length]),
  ) as PublicDataSnapshot['counts'];
}

export async function generatePublicDataSnapshot(
  outPath = DEFAULT_PUBLIC_DATA_SNAPSHOT_PATH,
): Promise<PublicDataSnapshot> {
  const db = getDb();
  const data: PublicDataSnapshotData = {
    aboutGallery: await db.select().from(aboutGallery),
    aboutPages: await db.select().from(aboutPage),
    articleCategories: await db.select().from(articleCategories),
    articleCategoryTranslations: await db.select().from(articleCategoryTranslations),
    articleProducts: await db.select().from(articleProducts),
    articleTranslationBodies: await db.select().from(articleTranslationBodies),
    articleTranslations: await db.select().from(articleTranslations),
    articles: await db.select().from(articles),
    bannerTranslations: await db.select().from(bannerTranslations),
    banners: await db.select().from(banners),
    categoryTranslations: await db.select().from(categoryTranslations),
    faqTranslations: await db.select().from(faqTranslations),
    faqs: await db.select().from(faqs),
    productCategories: await db.select().from(productCategories),
    productImages: await db.select().from(productImages),
    productSpecifications: await db.select().from(productSpecifications),
    productTranslations: await db.select().from(productTranslations),
    products: await db.select().from(products),
    videos: await db.select().from(videos),
  };

  const snapshot: PublicDataSnapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    counts: countsFor(data),
    data,
  };

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(snapshot)}\n`, 'utf8');
  console.log(`[public-data] Snapshot written to ${outPath}`);
  for (const [key, count] of Object.entries(snapshot.counts)) {
    console.log(`[public-data]   ${key}: ${count}`);
  }

  return snapshot;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generatePublicDataSnapshot(process.argv[2] ? resolve(process.argv[2]) : undefined).catch((err) => {
    console.error('[public-data] Snapshot generation failed:', err);
    process.exit(1);
  });
}
