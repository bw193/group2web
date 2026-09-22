import { notFound } from 'next/navigation';
import { getInsightIndexData } from '@/lib/insight';
import { hebrewCategorySegment } from '@/lib/public-paths';
import {
  categoryMetadata,
  renderCategoryPage,
  type CategoryPageProps,
} from '../../insight/[category]/CategoryRoute';
import type { Metadata } from 'next';

export const revalidate = 600;

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  return categoryMetadata(props);
}

/** Hebrew category segments carry the israel- prefix, like every other one. */
export async function generateStaticParams() {
  const { list, categories } = await getInsightIndexData('he');
  const stocked = new Set(list.map((a) => a.category));
  return categories
    .filter((c) => stocked.has(c.key))
    .map((c) => ({ locale: 'he', category: hebrewCategorySegment(c.key) }));
}

export default async function HebrewInsightCategoryPage(props: CategoryPageProps) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return renderCategoryPage(props);
}
