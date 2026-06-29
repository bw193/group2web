import { notFound } from 'next/navigation';
import { getProductStaticParams } from '@/lib/public-data';
import { generateMetadata } from '../../products/[slug]/page';
import { renderProductDetailPage } from '../../products/[slug]/ProductDetailRoute';

export { generateMetadata };
export const revalidate = 600;

export async function generateStaticParams() {
  return (await getProductStaticParams()).filter((p) => p.locale === 'he');
}

export default async function HebrewProductDetailPage(
  props: { params: Promise<{ locale: string; slug: string }> },
) {
  const params = await props.params;
  const { locale } = params;
  if (locale !== 'he') notFound();
  return renderProductDetailPage({ params: Promise.resolve(params) });
}
