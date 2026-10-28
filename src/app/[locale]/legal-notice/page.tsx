import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import LegalPage from '@/components/public/LegalPage';
import { legalDocument, legalMetadata } from '@/lib/legal-pages';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata(locale, 'legalNotice');
}

export default async function LegalNoticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage doc={legalDocument(locale, 'legalNotice')} />;
}
