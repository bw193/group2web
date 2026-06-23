import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ProductsFilter from './ProductsFilter';
import { JsonLd } from '@/components/seo/JsonLd';
import { getProductsPagePublicData } from '@/lib/public-data';
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  buildAlternates,
  localeToOg,
  localizedUrl,
  pageCopy,
} from '@/lib/seo';
import { getUploadUrl } from '@/lib/utils';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = pageCopy(locale, 'products');
  const url = localizedUrl(locale, '/products');

  // NOTE: intentionally does not read `searchParams`. Doing so would opt this
  // route back into dynamic rendering. `?q=` search variants are de-duplicated
  // by the canonical tag below (鈫?/products) and aren't crawlable links, so
  // they don't need a separate noindex.
  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(locale, '/products'),
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

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('products');
  const breadcrumbT = await getTranslations('breadcrumb');
  const { products: productsData, categories: categoriesData } = await getProductsPagePublicData(locale);

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: productsData.length,
    itemListElement: productsData.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: localizedUrl(locale, `/products/${p.slug}`),
      name: p.name,
      image: p.imageUrl ? getUploadUrl(p.imageUrl) : undefined,
    })),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('products'), item: localizedUrl(locale, '/products') },
    ],
  };

  return (
    <>
      <JsonLd id="ld-products-list" data={itemList} />
      <JsonLd id="ld-products-breadcrumb" data={breadcrumb} />

      {/* Page intro */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide pt-16 pb-14 md:pt-20 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5" data-reveal>
                {t('allCategories')}
              </p>
              <h1
                className="font-display text-4xl md:text-5xl lg:text-[64px] font-normal text-ink leading-[1.05] tracking-[-0.02em]"
                data-reveal
              >
                {t('title')}
              </h1>
            </div>
            <div className="lg:col-span-4 lg:text-end" data-reveal>
              <p className="text-[17px] font-body font-normal text-ink leading-[1.6] max-w-sm lg:ms-auto">
                {t('introText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductsFilter products={productsData} categories={categoriesData} />
    </>
  );
}
