import { notFound } from 'next/navigation';
import ContactPage, { generateMetadata } from '../contact/page';

export { generateMetadata };
export const revalidate = 600;

export function generateStaticParams() {
  return [{ locale: 'he' }];
}

export default async function HebrewContactPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return ContactPage(props);
}
