import type { Metadata } from 'next';
import { getInsightIndexData } from '@/lib/insight';
import { categoryMetadata, renderCategoryPage, type CategoryPageProps } from './CategoryRoute';

export const revalidate = 600;

/**
 * Called once per locale by the [locale] layout. Prerenders the categories
 * that hold stories in that locale's list; an empty category, a moved article
 * URL or an unknown segment resolves on demand instead. Hebrew renders under
 * /israel-insight.
 */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (params.locale === 'he') return [];
  const { list } = await getInsightIndexData(params.locale);
  return [...new Set(list.map((a) => a.category))].map((category) => ({ category }));
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  return categoryMetadata(props);
}

export default async function InsightCategoryPage(props: CategoryPageProps) {
  return renderCategoryPage(props, { redirectHebrewSegment: true });
}
