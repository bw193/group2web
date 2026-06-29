import { notFound } from 'next/navigation';
import InsightPage, { generateMetadata } from '../insight/page';

export { generateMetadata };
export const revalidate = 600;

export function generateStaticParams() {
  return [{ locale: 'he' }];
}

export default async function HebrewInsightPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return InsightPage(props);
}
