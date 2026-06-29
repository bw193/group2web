import { notFound } from 'next/navigation';
import ContactThankYouPage, { generateMetadata } from '../../contact/thank-you/page';

export { generateMetadata };

export function generateStaticParams() {
  return [{ locale: 'he' }];
}

export default async function HebrewContactThankYouPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (locale !== 'he') notFound();
  return ContactThankYouPage(props);
}
