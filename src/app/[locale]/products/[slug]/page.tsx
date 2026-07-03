import type { Metadata } from 'next';
import { getUploadUrl } from '@/lib/utils';
import { getProductMetadataData, getProductStaticParams } from '@/lib/public-data';
import {
  SITE_OG_IMAGE,
  localeToOg,
  localizedSiteName,
  localizedUrl,
  productTitle,
  shouldIncludeSeoAlternate,
  shouldIncludeXDefault,
} from '@/lib/seo';
import { locales, defaultLocale } from '@/i18n/config';
import { renderProductDetailPage, type ProductDetailPageProps } from './ProductDetailRoute';

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteName = localizedSiteName(locale);

  try {
    const row = await getProductMetadataData(locale, slug);
    if (!row) {
      return { title: productTitle('Product', locale), robots: { index: false, follow: true } };
    }

    const languages: Record<string, string> = {};
    for (const t of row.allTranslations) {
      if ((locales as readonly string[]).includes(t.locale) && shouldIncludeSeoAlternate(locale, t.locale)) {
        languages[t.locale] = localizedUrl(t.locale, `/products/${t.slug}`);
      }
    }
    const defaultRow = row.allTranslations.find((t) => t.locale === defaultLocale);
    if (defaultRow && shouldIncludeXDefault(locale)) {
      languages['x-default'] = localizedUrl(defaultLocale, `/products/${defaultRow.slug}`);
    }

    const ogImage = row.primaryImage?.imageUrl
      ? getUploadUrl(row.primaryImage.imageUrl)
      : SITE_OG_IMAGE;

    const title = productTitle(row.translation.name, locale);
    const description = row.translation.shortDescription
      ? row.translation.shortDescription.slice(0, 300)
      : `${row.trans.name}${row.product.modelNumber ? ` (Model ${row.product.modelNumber})` : ''} - manufactured by ${siteName}, Jiaxing, China. OEM/ODM available.`;

    const canonical = localizedUrl(locale, `/products/${row.translation.slug}`);

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: Object.keys(languages).length ? languages : undefined,
      },
      openGraph: {
        type: 'website',
        url: canonical,
        siteName,
        title,
        description,
        locale: localeToOg(locale),
        images: [{ url: ogImage, width: 1200, height: 630, alt: row.trans.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: productTitle('Product', locale) };
  }
}

export async function generateStaticParams() {
  return (await getProductStaticParams()).filter((p) => p.locale !== 'he');
}

export default async function ProductDetailPage(props: ProductDetailPageProps) {
  return renderProductDetailPage(props, { redirectHebrewSegment: true });
}
