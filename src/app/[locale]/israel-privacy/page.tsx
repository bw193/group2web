import { notFound } from 'next/navigation';
import PrivacyPage, { generateMetadata } from '../privacy/page';

export { generateMetadata };

export function generateStaticParams() {
  return [{ locale: 'he' }];
}

export default async function HebrewPrivacyPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return PrivacyPage(props);
}
