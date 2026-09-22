import type { Metadata } from 'next';
import { getInsightIndexData } from '@/lib/insight';
import {
  categoryMetadata,
  renderCategoryPage,
  type CategoryPageProps,
} from './CategoryRoute';

export const revalidate = 600;

/**
 * Prerender the categories that hold stories. Everything else this route
 * answers — an empty category, a moved article URL, an unknown segment —
 * resolves on demand and redirects or 404s, so none of it belongs here.
 */
export async function generateStaticParams() {
  const { list, categories } = await getInsightIndexData('en');
  const stocked = new Set(list.map((a) => a.category));
  return categories.filter((c) => stocked.has(c.key)).map((c) => ({ category: c.key }));
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  return categoryMetadata(props);
}

export default async function InsightCategoryPage(props: CategoryPageProps) {
  return renderCategoryPage(props, { redirectHebrewSegment: true });
}
