import type { Metadata } from 'next';
import {
  productCategoryMetadata,
  renderProductCategoryPage,
  stockedCategoryParams,
  type ProductCategoryPageProps,
} from './CategoryRoute';

export const revalidate = 300;

/**
 * Called once per locale by the [locale] layout. Prerenders the categories
 * that hold products; an empty category, an old flat product URL or an
 * unknown segment resolves on demand instead. Hebrew renders under
 * /israel-products.
 */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (params.locale === 'he') return [];
  return stockedCategoryParams(params.locale);
}

export async function generateMetadata(props: ProductCategoryPageProps): Promise<Metadata> {
  return productCategoryMetadata(props);
}

export default async function ProductCategoryPage(props: ProductCategoryPageProps) {
  return renderProductCategoryPage(props, { redirectHebrewSegment: true });
}
