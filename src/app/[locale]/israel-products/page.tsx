import { notFound } from 'next/navigation';
import ProductsPage, { generateMetadata } from '../products/page';

export { generateMetadata };
export const revalidate = 300;

export function generateStaticParams() {
  return [{ locale: 'he' }];
}

export default async function HebrewProductsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return ProductsPage(props);
}
