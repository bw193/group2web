import { notFound } from 'next/navigation';
import { getArticleStaticParams } from '@/lib/insight';
import { insightCategorySegment } from '@/lib/public-paths';
import { generateMetadata } from '../../../insight/[category]/[slug]/page';
import {
  renderArticlePage,
  type ArticlePageProps,
} from '../../../insight/[category]/[slug]/ArticleDetailRoute';

export { generateMetadata };
export const revalidate = 600;

/** Hebrew only; its category segment carries the israel- prefix like every other one. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (params.locale !== 'he') return [];
  return (await getArticleStaticParams('he')).map(({ category, slug }) => ({
    category: insightCategorySegment('he', category),
    slug,
  }));
}

export default async function HebrewArticlePage(props: ArticlePageProps) {
  const params = await props.params;
  if (params.locale !== 'he') notFound();
  return renderArticlePage({ params: Promise.resolve(params) });
}
