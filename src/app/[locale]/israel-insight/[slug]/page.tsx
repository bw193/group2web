import { notFound } from 'next/navigation';
import { getArticleStaticParams } from '@/lib/insight';
import { generateMetadata } from '../../insight/[slug]/page';
import { renderArticlePage } from '../../insight/[slug]/ArticleDetailRoute';

export { generateMetadata };
export const revalidate = 600;

export async function generateStaticParams() {
  return (await getArticleStaticParams()).filter((p) => p.locale === 'he');
}

export default async function HebrewArticlePage(
  props: { params: Promise<{ locale: string; slug: string }> },
) {
  const params = await props.params;
  const { locale } = params;
  if (locale !== 'he') notFound();
  return renderArticlePage({ params: Promise.resolve(params) });
}
