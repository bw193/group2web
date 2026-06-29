import { notFound } from 'next/navigation';
import AboutPage, { generateMetadata } from '../about/page';

export { generateMetadata };
export const revalidate = 600;

export function generateStaticParams() {
  return [{ locale: 'he' }];
}

export default async function HebrewAboutPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return AboutPage(props);
}
