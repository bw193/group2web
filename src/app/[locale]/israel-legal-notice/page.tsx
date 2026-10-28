import { notFound } from 'next/navigation';
import LegalNoticePage, { generateMetadata } from '../legal-notice/page';

export { generateMetadata };

export function generateStaticParams() {
  return [{ locale: 'he' }];
}

export default async function HebrewLegalNoticePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return LegalNoticePage(props);
}
