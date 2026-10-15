import type { Metadata } from 'next';
import { getProductStaticParams } from '@/lib/public-data';
import {
  productMetadata,
  renderProductDetailPage,
  type ProductDetailPageProps,
} from './ProductDetailRoute';

export const revalidate = 600;

/**
 * Called once per locale by the [locale] layout, so it returns this locale's
 * products only, each under its category. Hebrew products render under
 * /israel-products instead.
 */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  if (params.locale === 'he') return [];
  return getProductStaticParams(params.locale);
}

export async function generateMetadata(props: ProductDetailPageProps): Promise<Metadata> {
  return productMetadata(props);
}

export default async function ProductDetailPage(props: ProductDetailPageProps) {
  return renderProductDetailPage(props, { redirectHebrewSegment: true });
}
