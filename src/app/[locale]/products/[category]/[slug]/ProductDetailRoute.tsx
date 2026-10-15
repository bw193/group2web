import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowRight, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/public/ProductCard';
import VideoCard from '@/components/public/videos/VideoCard';
import ProofPoints from '@/components/public/ProofPoints';
import { JsonLd } from '@/components/seo/JsonLd';
import { defaultLocale, locales } from '@/i18n/config';
import { isIndexableLocalePath } from '@/lib/indexing';
import { getProductDetailData, getProductMetadataData } from '@/lib/public-data';
import { withResponsiveDescriptionImages } from '@/lib/description-images';
import { productCategorySlug } from '@/lib/product-categories';
import { usesItemPageMarkup } from '@/lib/product-markup';
import {
  productCategoryPathAfterLocale,
  productCategorySegment,
  productPathAfterLocale,
} from '@/lib/public-paths';
import { getUploadUrl } from '@/lib/utils';
import {
  SITE_OG_IMAGE,
  SITE_URL,
  localeToOg,
  localizedSiteName,
  localizedPath,
  localizedUrl,
  productTitle,
} from '@/lib/seo';
import ImageGallery from './ImageGallery';

/**
 * /products/<category>/<slug> — a product page, under the category it belongs
 * to. `category` is absent when the flat /products/<slug> reaches here
 * through the [category] route: an old link, sent on to the categorized URL,
 * or the page of a product that has no category and so keeps the flat one.
 *
 * Lives outside page.tsx because a page module may only export Next's own
 * names, and the Hebrew mirror and the [category] route render it too — the
 * same split as the Insight routes.
 */
export type ProductDetailPageProps = {
  params: Promise<{ locale: string; category?: string; slug: string }>;
};

export async function productMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteName = localizedSiteName(locale);

  try {
    const row = await getProductMetadataData(locale, slug);
    if (!row) {
      return { title: productTitle('Product', locale), robots: { index: false, follow: true } };
    }

    // The category belongs to the product, so every translation shares it;
    // the URL's own segment is ignored because the page redirects when it
    // disagrees. Skip locales whose page is noindex at this path (Hebrew
    // detail pages) — hreflang must never point at a URL we've asked not to
    // be indexed.
    const pathFor = (slugInLocale: string) =>
      productPathAfterLocale(productCategorySlug(row.product.categoryId), slugInLocale);
    const languages: Record<string, string> = {};
    for (const t of row.allTranslations) {
      if (!(locales as readonly string[]).includes(t.locale)) continue;
      if (!isIndexableLocalePath(t.locale, pathFor(t.slug))) continue;
      languages[t.locale] = localizedUrl(t.locale, pathFor(t.slug));
    }
    const defaultRow = row.allTranslations.find((t) => t.locale === defaultLocale);
    if (defaultRow) {
      languages['x-default'] = localizedUrl(defaultLocale, pathFor(defaultRow.slug));
    }

    const ogImage = row.primaryImage?.imageUrl
      ? getUploadUrl(row.primaryImage.imageUrl)
      : SITE_OG_IMAGE;

    const title = productTitle(row.translation.name, locale);
    const description = row.translation.shortDescription
      ? row.translation.shortDescription.slice(0, 300)
      : `${row.trans.name}${row.product.modelNumber ? ` (Model ${row.product.modelNumber})` : ''} - manufactured by ${siteName}, Jiaxing, China. OEM/ODM available.`;

    const canonical = localizedUrl(locale, pathFor(row.translation.slug));

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

export async function renderProductDetailPage(
  { params }: ProductDetailPageProps,
  options: { redirectHebrewSegment?: boolean } = {},
) {
  const { locale, category: categorySegment, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('products');
  const videosT = await getTranslations('videos');
  const breadcrumbT = await getTranslations('breadcrumb');
  const detail = await getProductDetailData(locale, slug);
  if (detail.type === 'notFound') notFound();
  if (detail.type === 'redirect') permanentRedirect(detail.destination);

  const { product, translation: trans, categoryName, specs, images, related, relatedVideos } = detail;
  const categorySlug = productCategorySlug(product.categoryId);
  const productPath = productPathAfterLocale(categorySlug, trans.slug);
  // One product, one URL. A Hebrew request on the generic route, a flat
  // /products/<slug> for a product that has a category, or a category segment
  // that is not this product's own in this locale's form (a moved product, a
  // stale link, a Hebrew segment missing its israel- prefix) goes to the
  // canonical URL in a single permanent redirect.
  const expectedSegment = categorySlug ? productCategorySegment(locale, categorySlug) : undefined;
  if ((options.redirectHebrewSegment && locale === 'he') || categorySegment !== expectedSegment) {
    permanentRedirect(localizedPath(locale, productPath));
  }

  const siteName = localizedSiteName(locale);
  // The category level of the breadcrumb, when the category has a page.
  const categoryCrumb =
    categorySlug && categoryName
      ? { name: categoryName, path: productCategoryPathAfterLocale(categorySlug) }
      : null;

  const imageUrls = images.length > 0
    ? images.map((img) => getUploadUrl(img.imageUrl))
    : ['/images/placeholder.svg'];

  const productUrl = localizedUrl(locale, productPath);
  const breadcrumbId = `${productUrl}#breadcrumb`;
  const description =
    trans.shortDescription ||
    (trans.fullDescription
      ? trans.fullDescription.replace(/<[^>]+>/g, '').slice(0, 500)
      : `${trans.name} - manufactured by ${siteName}.`);
  const useItemPageMarkup = usesItemPageMarkup(product.id);

  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: trans.name,
    image: imageUrls,
    description,
    brand: { '@type': 'Brand', name: siteName },
    manufacturer: { '@id': `${SITE_URL}/#organization` },
    url: productUrl,
  };
  if (product.modelNumber) {
    productJsonLd.sku = product.modelNumber;
    productJsonLd.mpn = product.modelNumber;
  }

  // Mirror the visible spec table into structured data so answer engines read
  // dimensions, IP ratings and certifications as facts instead of inferring
  // them from prose. Two deliberate non-transformations: property names stay in
  // the page's own locale (the CMS translates spec keys, and a localized name
  // matches how buyers phrase the question), and repeated names are kept, since
  // a product legitimately carries e.g. both a concrete size and "custom".
  const modelNumber = product.modelNumber?.trim().toLowerCase();
  const specProperties = specs
    .map((s) => ({ name: s.specKey.trim(), value: s.specValue.trim() }))
    .filter((p) => p.name && p.value && p.value.toLowerCase() !== modelNumber)
    .slice(0, 20);
  if (specProperties.length > 0) {
    productJsonLd.additionalProperty = specProperties.map((p) => ({
      '@type': 'PropertyValue',
      name: p.name,
      value: p.value,
    }));
  }

  // A quote-only page can't carry the price or ratings a Product snippet needs,
  // so the products staged in ITEM_PAGE_MARKUP_PRODUCTS describe the page itself
  // instead of claiming to be a purchasable product.
  const itemPageJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ItemPage',
    '@id': `${productUrl}#page`,
    url: productUrl,
    name: trans.name,
    description,
    inLanguage: locale,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    breadcrumb: { '@id': breadcrumbId },
    primaryImageOfPage: { '@type': 'ImageObject', url: imageUrls[0] },
  };

  const productBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId,
    itemListElement: [
      { name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { name: breadcrumbT('products'), item: localizedUrl(locale, '/products') },
      ...(categoryCrumb ? [{ name: categoryCrumb.name, item: localizedUrl(locale, categoryCrumb.path) }] : []),
      { name: trans.name, item: productUrl },
    ].map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, ...crumb })),
  };

  return (
    <>
      <JsonLd
        id={useItemPageMarkup ? 'ld-item-page' : 'ld-product'}
        data={useItemPageMarkup ? itemPageJsonLd : productJsonLd}
      />
      <JsonLd id="ld-product-breadcrumb" data={productBreadcrumb} />

      <nav aria-label="Breadcrumb" className="bg-cream border-b border-warm-border">
        <div className="container-wide py-4">
          <ol className="flex items-center gap-2.5 text-[12px] font-body font-semibold tracking-[0.12em] uppercase">
            {/* Four levels do not fit a phone (German's run past 400px), so
                below sm a product with a category shows just Products and the
                category: the logo already leads home, and the H1 just below
                names the product. */}
            <li className={`${categoryCrumb ? 'hidden sm:block ' : ''}flex-shrink-0`}>
              <Link href={localizedPath(locale, '')} className="text-ink-mid hover:text-ink transition-colors duration-300">
                {breadcrumbT('home')}
              </Link>
            </li>
            <li aria-hidden className={`${categoryCrumb ? 'hidden sm:block ' : ''}flex-shrink-0 text-ink-light`}>
              <ChevronRight size={13} strokeWidth={2} />
            </li>
            <li className="flex-shrink-0">
              <Link href={localizedPath(locale, '/products')} className="text-ink-mid hover:text-ink transition-colors duration-300">
                {breadcrumbT('products')}
              </Link>
            </li>
            <li aria-hidden className="flex-shrink-0 text-ink-light">
              <ChevronRight size={13} strokeWidth={2} />
            </li>
            {categoryCrumb && (
              <>
                <li className="min-w-0 truncate">
                  <Link href={localizedPath(locale, categoryCrumb.path)} className="text-ink-mid hover:text-ink transition-colors duration-300">
                    {categoryCrumb.name}
                  </Link>
                </li>
                <li aria-hidden className="hidden sm:block flex-shrink-0 text-ink-light">
                  <ChevronRight size={13} strokeWidth={2} />
                </li>
              </>
            )}
            <li
              className={`${categoryCrumb ? 'hidden sm:block ' : ''}min-w-0 truncate text-ink`}
              aria-current="page"
            >
              {trans.name}
            </li>
          </ol>
        </div>
      </nav>

      <section className="bg-cream">
        <div className="container-wide py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 lg:items-start">
            <div className="lg:col-span-7 lg:sticky lg:top-28 lg:self-start">
              <ImageGallery images={imageUrls} productName={trans.name} />
            </div>

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

              <div className="border border-warm-border bg-sand/60 p-6 sm:p-7">
                <Link
                  href={localizedPath(locale, `/contact?product=${encodeURIComponent(trans.name)}${
                    product.modelNumber ? `&model=${encodeURIComponent(product.modelNumber)}` : ''
                  }`)}
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

          <ProofPoints
            copy="products"
            className="mt-16 pt-12 md:mt-20 md:pt-14 border-t border-warm-border"
            noSnippet
          />

          {trans.fullDescription && (
            <div className="mt-20 pt-14 border-t border-warm-border">
              <div className="max-w-[760px] mx-auto">
                <p className="kicker-plain mb-5">{t('detailsTitle')}</p>
                <div
                  className="prose-content text-[16px]"
                  dangerouslySetInnerHTML={{ __html: withResponsiveDescriptionImages(trans.fullDescription) }}
                />
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-24 pt-14 border-t border-warm-border" data-reveal>
              <div className="flex items-end justify-between mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1]">
                  {t('relatedProducts')}
                </h2>
                <Link
                  href={localizedPath(locale, '/products')}
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
                  href={localizedPath(locale, '/videos')}
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
