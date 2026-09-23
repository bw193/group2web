import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getInsightIndexData } from '@/lib/insight';
import { insightCategorySegment } from '@/lib/public-paths';
import {
  categoryMetadata,
  renderCategoryPage,
  type CategoryPageProps,
} from '../../insight/[category]/CategoryRoute';

export const revalidate = 600;

/** Hebrew only; the category segment carries the israel- prefix like every other one. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (params.locale !== 'he') return [];
  const { list } = await getInsightIndexData('he');
  return [...new Set(list.map((a) => a.category))].map((category) => ({
    category: insightCategorySegment('he', category),
  }));
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  return categoryMetadata(props);
}

export default async function HebrewInsightCategoryPage(props: CategoryPageProps) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return renderCategoryPage(props);
}
