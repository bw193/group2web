import { notFound } from 'next/navigation';
import { getProductStaticParams } from '@/lib/public-data';
import { productCategorySegment } from '@/lib/public-paths';
import { generateMetadata } from '../../../products/[category]/[slug]/page';
import {
  renderProductDetailPage,
  type ProductDetailPageProps,
} from '../../../products/[category]/[slug]/ProductDetailRoute';

export { generateMetadata };
export const revalidate = 600;

/** Hebrew only; its category segment carries the israel- prefix like every other one. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (params.locale !== 'he') return [];
  return (await getProductStaticParams('he')).map(({ category, slug }) => ({
    category: productCategorySegment('he', category),
    slug,
  }));
}

export default async function HebrewProductDetailPage(props: ProductDetailPageProps) {
  const params = await props.params;
  if (params.locale !== 'he') notFound();
  return renderProductDetailPage({ params: Promise.resolve(params) });
}
