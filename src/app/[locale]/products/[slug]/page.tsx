import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getUploadUrl } from '@/lib/utils';
import { ArrowRight, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/public/ProductCard';
import VideoCard from '@/components/public/videos/VideoCard';
import ProofPoints from '@/components/public/ProofPoints';
import ImageGallery from './ImageGallery';
import { JsonLd } from '@/components/seo/JsonLd';
import { getProductDetailData, getProductMetadataData, getProductStaticParams } from '@/lib/public-data';
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
  localeToOg,
  localizedUrl,
  productTitle,
} from '@/lib/seo';
import { locales, defaultLocale } from '@/i18n/config';

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const row = await getProductMetadataData(locale, slug);
    if (!row) {
      // Leave defaults; the page will render notFound() or redirect.
      return { title: productTitle('Product'), robots: { index: false, follow: true } };
    }

    // Per-locale slugs for hreflang on this specific product.
    const languages: Record<string, string> = {};
    for (const t of row.allTranslations) {
      if ((locales as readonly string[]).includes(t.locale)) {
        languages[t.locale] = localizedUrl(t.locale, `/products/${t.slug}`);
      }
    }
    const defaultRow = row.allTranslations.find((t) => t.locale === defaultLocale);
    if (defaultRow) {
      languages['x-default'] = localizedUrl(defaultLocale, `/products/${defaultRow.slug}`);
    }

    const ogImage = row.primaryImage?.imageUrl
      ? getUploadUrl(row.primaryImage.imageUrl)
      : SITE_OG_IMAGE;

    const title = productTitle(row.translation.name);
    const description = row.translation.shortDescription
      ? row.translation.shortDescription.slice(0, 300)
      : `${row.trans.name}${row.product.modelNumber ? ` (Model ${row.product.modelNumber})` : ''} - manufactured by Chengtai Mirror, Jiaxing, China. OEM/ODM available.`;

    const canonical = localizedUrl(locale, `/products/${slug}`);

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: Object.keys(languages).length ? languages : undefined,
      },
      openGraph: {
        // og:type=product would be more accurate per the OG protocol, but
        // Next 15's runtime OpenGraph resolver hard-rejects values
        // outside its union (throws "Invalid OpenGraph type: product"
        // server-side, which surfaces as a 500 on Vercel). Stay on
        // 'website' until Next adds 'product' to the supported set.
        type: 'website',
        url: canonical,
        siteName: SITE_NAME,
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
    return { title: productTitle('Product') };
  }
}

export async function generateStaticParams() {
  return getProductStaticParams();
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('products');
  const videosT = await getTranslations('videos');
  const breadcrumbT = await getTranslations('breadcrumb');
  const detail = await getProductDetailData(locale, slug);
  if (detail.type === 'notFound') notFound();
  if (detail.type === 'redirect') permanentRedirect(detail.destination);

  const { product, translation: trans, specs, images, related, relatedVideos } = detail;

  const imageUrls = images.length > 0
    ? images.map((img) => getUploadUrl(img.imageUrl))
    : ['/images/placeholder.svg'];

  const productUrl = localizedUrl(locale, `/products/${trans.slug}`);
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: trans.name,
    image: imageUrls,
    description:
      trans.shortDescription ||
      (trans.fullDescription ? trans.fullDescription.replace(/<[^>]+>/g, '').slice(0, 500) : `${trans.name} - manufactured by ${SITE_NAME}.`),
    brand: { '@type': 'Brand', name: SITE_NAME },
    manufacturer: { '@id': `${SITE_URL}/#organization` },
    url: productUrl,
  };
  if (product.modelNumber) {
    productJsonLd.sku = product.modelNumber;
    productJsonLd.mpn = product.modelNumber;
  }

  const productBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('products'), item: localizedUrl(locale, '/products') },
      { '@type': 'ListItem', position: 3, name: trans.name, item: localizedUrl(locale, `/products/${trans.slug}`) },
    ],
  };

  return (
    <>
      <JsonLd id="ld-product" data={productJsonLd} />
      <JsonLd id="ld-product-breadcrumb" data={productBreadcrumb} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-cream border-b border-warm-border">
        <div className="container-wide py-4">
          <ol className="flex items-center gap-2.5 text-[12px] font-body font-semibold tracking-[0.12em] uppercase">
            <li className="flex-shrink-0">
              <Link href={`/${locale}`} className="text-ink-mid hover:text-ink transition-colors duration-300">
                {breadcrumbT('home')}
              </Link>
            </li>
            <li aria-hidden className="flex-shrink-0 text-ink-light">
              <ChevronRight size={13} strokeWidth={2} />
            </li>
            <li className="flex-shrink-0">
              <Link href={`/${locale}/products`} className="text-ink-mid hover:text-ink transition-colors duration-300">
                {breadcrumbT('products')}
              </Link>
            </li>
            <li aria-hidden className="flex-shrink-0 text-ink-light">
              <ChevronRight size={13} strokeWidth={2} />
            </li>
            <li className="min-w-0 truncate text-ink" aria-current="page">
              {trans.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Product Detail */}
      <section className="bg-cream">
        <div className="container-wide py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 lg:items-start">
            {/* Image Gallery */}
            <div className="lg:col-span-7 lg:sticky lg:top-28 lg:self-start">
              <ImageGallery images={imageUrls} productName={trans.name} />
            </div>

            {/* Product Info */}
            <div className="lg:col-span-5 lg:pt-4">
              {product.modelNumber && (
                <p className="kicker-plain mb-4">
                  {t('modelNumber')} - {product.modelNumber}
                </p>
              )}
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.05] text-ink tracking-[-0.02em] mb-6">
                {trans.name}
              </h1>
              {trans.shortDescription && (
                <p className="text-ink font-body font-normal leading-[1.6] text-[17px] md:text-[18px] mb-10 max-w-md">
                  {trans.shortDescription}
                </p>
              )}

              {/* Specifications */}
              {specs.length > 0 && (
                <div className="mb-10">
                  <p className="kicker-plain mb-5">{t('specifications')}</p>
                  <dl className="border-y border-warm-border divide-y divide-warm-border">
                    {specs.map((spec) => (
                      <div
                        key={spec.id}
                        className="grid grid-cols-[40%_1fr] sm:grid-cols-[150px_1fr] gap-4 py-3.5"
                      >
                        <dt className="text-[12px] font-body font-semibold text-ink-mid tracking-[0.1em] uppercase pt-0.5">
                          {spec.specKey}
                        </dt>
                        <dd className="text-[15px] font-body font-normal text-ink leading-[1.5]">
                          {spec.specValue}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* CTA */}
              <div className="border border-warm-border bg-sand/60 p-6 sm:p-7">
                <Link
                  href={`/${locale}/contact?product=${encodeURIComponent(trans.name)}${
                    product.modelNumber ? `&model=${encodeURIComponent(product.modelNumber)}` : ''
                  }`}
                  className="btn-primary group w-full sm:w-auto"
                >
                  {t('sendInquiry')}
                  <ArrowRight size={14} strokeWidth={1.75} className="ms-3 transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100" />
                </Link>
                <p className="mt-4 text-[13px] font-body text-ink-mid leading-[1.6]">
                  <span data-nosnippet="">{t('inquiryPrompt')}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Trust strip - the three manufacturer proof points, shared with the
              homepage factory section. Presentational only (no Product JSON-LD
              change), so repeating it across product pages stays SEO-neutral. */}
          <ProofPoints className="mt-16 pt-12 md:mt-20 md:pt-14 border-t border-warm-border" noSnippet />

          {/* Full Description - intentionally not gated behind data-reveal:
              this is primary indexable copy, so it stays always-visible. */}
          {trans.fullDescription && (
            <div className="mt-20 pt-14 border-t border-warm-border">
              <p className="kicker-plain mb-5">{t('detailsTitle')}</p>
              <div
                className="prose-content text-[16px] max-w-[760px]"
                dangerouslySetInnerHTML={{ __html: trans.fullDescription }}
              />
            </div>
          )}

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-24 pt-14 border-t border-warm-border" data-reveal>
              <div className="flex items-end justify-between mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1]">
                  {t('relatedProducts')}
                </h2>
                <Link
                  href={`/${locale}/products`}
                  className="hidden md:inline-flex items-center gap-2 text-[13px] font-body font-semibold tracking-[0.14em] uppercase text-ink hover:text-bronze transition-colors group"
                >
                  {t('viewAll') || 'View all'}
                  <ArrowRight size={14} strokeWidth={1.75} className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 md:gap-x-10 md:gap-y-16">
                {related.map((p, i) => (
                  <ProductCard key={p.id} index={i} {...p} noSnippet />
                ))}
              </div>
            </div>
          )}

          {relatedVideos.length > 0 && (
            <div className="mt-24 pt-14 border-t border-warm-border" data-reveal>
              <div className="flex items-end justify-between mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1]">
                  {videosT('relatedVideos')}
                </h2>
                <Link
                  href={`/${locale}/videos`}
                  className="hidden md:inline-flex items-center gap-2 text-[13px] font-body font-semibold tracking-[0.14em] uppercase text-ink hover:text-bronze transition-colors group"
                >
                  {videosT('viewAllVideos')}
                  <ArrowRight size={14} strokeWidth={1.75} className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-14 md:gap-x-10">
                {relatedVideos.map((video, i) => (
                  <VideoCard key={video.id} video={video} locale={locale} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
