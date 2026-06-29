import { notFound } from 'next/navigation';
import HomePage, { generateMetadata } from '../page';

export { generateMetadata };
export const revalidate = 300;

export function generateStaticParams() {
  return [{ locale: 'he' }];
}

export default async function HebrewHomePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return HomePage(props);
}
