import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  productCategoryMetadata,
  renderProductCategoryPage,
  stockedCategoryParams,
  type ProductCategoryPageProps,
} from '../../products/[category]/CategoryRoute';

export const revalidate = 300;

/** Hebrew only; the category segment carries the israel- prefix like every other one. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (params.locale !== 'he') return [];
  return stockedCategoryParams('he');
}

export async function generateMetadata(props: ProductCategoryPageProps): Promise<Metadata> {
  return productCategoryMetadata(props);
}

export default async function HebrewProductCategoryPage(props: ProductCategoryPageProps) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return renderProductCategoryPage(props);
}
