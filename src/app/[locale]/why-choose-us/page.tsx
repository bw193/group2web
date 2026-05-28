import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import WhyChooseUs from '@/components/public/WhyChooseUs';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  buildAlternates,
  localeToOg,
  localizedUrl,
  pageCopy,
} from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = pageCopy(locale, 'why-choose-us');
  const url = localizedUrl(locale, '/why-choose-us');

  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(locale, '/why-choose-us'),
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      title: copy.title,
      description: copy.description,
      locale: localeToOg(locale),
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function WhyChooseUsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Static-rendering opt-in (see memory: static-rendering-isr). Page is
  // content-only (no DB), so it prerenders fully.
  setRequestLocale(locale);
  const t = await getTranslations('whyUs');
  const breadcrumbT = await getTranslations('breadcrumb');

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: t('title'), item: localizedUrl(locale, '/why-choose-us') },
    ],
  };

  return (
    <>
      <JsonLd id="ld-why-breadcrumb" data={breadcrumb} />
      <WhyChooseUs locale={locale} />
    </>
  );
}
