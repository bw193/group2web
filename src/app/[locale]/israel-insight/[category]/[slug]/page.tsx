import { notFound } from 'next/navigation';
import { getArticleStaticParams } from '@/lib/insight';
import { hebrewCategorySegment } from '@/lib/public-paths';
import { generateMetadata } from '../../../insight/[category]/[slug]/page';
import { renderArticlePage } from '../../../insight/[category]/[slug]/ArticleDetailRoute';

export { generateMetadata };
export const revalidate = 600;

export async function generateStaticParams() {
  return (await getArticleStaticParams())
    .filter((p) => p.locale === 'he')
    .map((p) => ({ locale: p.locale, category: hebrewCategorySegment(p.category), slug: p.slug }));
}

export default async function HebrewArticlePage(
  props: { params: Promise<{ locale: string; category: string; slug: string }> },
) {
  const params = await props.params;
  const { locale } = params;
  if (locale !== 'he') notFound();
  return renderArticlePage({ params: Promise.resolve(params) });
}
