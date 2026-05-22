import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { products, productTranslations, productSpecifications, productImages } from '@/lib/db/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { getUploadUrl } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/public/ProductCard';
import ImageGallery from './ImageGallery';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
  localeToOg,
  localizedPath,
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
    const db = getDb();
    const joined = await db
      .select({ product: products, trans: productTranslations })
      .from(productTranslations)
      .innerJoin(products, eq(products.id, productTranslations.productId))
      .where(
        and(
          eq(productTranslations.slug, slug),
          eq(productTranslations.locale, locale),
          eq(products.isActive, true),
        ),
      )
      .limit(1);

    const row = joined[0];
    if (!row) {
      // Leave defaults; the page will render notFound() or redirect.
      return { title: productTitle('Product'), robots: { index: false, follow: true } };
    }

    // Per-locale slugs for hreflang on this specific product.
    const allTrans = await db
      .select({ locale: productTranslations.locale, slug: productTranslations.slug })
      .from(productTranslations)
      .where(eq(productTranslations.productId, row.product.id));

    const languages: Record<string, string> = {};
    for (const t of allTrans) {
      if ((locales as readonly string[]).includes(t.locale)) {
        languages[t.locale] = localizedUrl(t.locale, `/products/${t.slug}`);
      }
    }
    const defaultRow = allTrans.find((t) => t.locale === defaultLocale);
    if (defaultRow) {
      languages['x-default'] = localizedUrl(defaultLocale, `/products/${defaultRow.slug}`);
    }

    const primaryImg = await db
      .select({ imageUrl: productImages.imageUrl })
      .from(productImages)
      .where(eq(productImages.productId, row.product.id))
      .orderBy(productImages.displayOrder)
      .limit(1);

    const ogImage = primaryImg[0]?.imageUrl
      ? getUploadUrl(primaryImg[0].imageUrl)
      : SITE_OG_IMAGE;

    const title = productTitle(row.trans.name);
    const description = row.trans.shortDescription
      ? row.trans.shortDescription.slice(0, 300)
      : `${row.trans.name}${row.product.modelNumber ? ` (Model ${row.product.modelNumber})` : ''} — manufactured by Chengtai Mirror, Jiaxing, China. OEM/ODM available.`;

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
  try {
    const db = getDb();
    const rows = await db
      .select({ locale: productTranslations.locale, slug: productTranslations.slug })
      .from(productTranslations);
    return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('products');
  const common = await getTranslations('common');
  const breadcrumbT = await getTranslations('breadcrumb');
  const db = getDb();

  const joined = await db
    .select({ product: products, trans: productTranslations })
    .from(productTranslations)
    .innerJoin(products, eq(products.id, productTranslations.productId))
    .where(
      and(
        eq(productTranslations.slug, slug),
        eq(productTranslations.locale, locale),
        eq(products.isActive, true),
      ),
    )
    .limit(1);

  let product = joined[0]?.product;
  let translation = joined[0]?.trans;

  if (!product) {
    // Slug not present in requested locale. Look for the product by slug
    // in *any* locale, then redirect to its translation in the requested
    // locale if one exists. This preserves URL ↔ language consistency
    // (no English content under /fr/, etc.) and avoids duplicate content.
    const any = await db
      .select({ product: products, trans: productTranslations })
      .from(productTranslations)
      .innerJoin(products, eq(products.id, productTranslations.productId))
      .where(and(eq(productTranslations.slug, slug), eq(products.isActive, true)))
      .limit(1);
    const target = any[0];
    if (!target) notFound();

    const localizedSlugRow = await db
      .select({ slug: productTranslations.slug })
      .from(productTranslations)
      .where(
        and(
          eq(productTranslations.productId, target.product.id),
          eq(productTranslations.locale, locale),
        ),
      )
      .limit(1);

    if (localizedSlugRow[0]?.slug && localizedSlugRow[0].slug !== slug) {
      redirect(localizedPath(locale, `/products/${localizedSlugRow[0].slug}`));
    }

    // No translation for this locale — render whatever we have to avoid 404,
    // but mark the page noindex via metadata fallback. (notFound is harsher.)
    product = target.product;
    translation = target.trans;
  }
  if (!product || !translation) notFound();

  const [specs, images, localeTrans] = await Promise.all([
    db
      .select()
      .from(productSpecifications)
      .where(and(eq(productSpecifications.productId, product.id), eq(productSpecifications.locale, locale))),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.displayOrder),
    translation.locale === locale
      ? Promise.resolve(null)
      : db
          .select()
          .from(productTranslations)
          .where(and(eq(productTranslations.productId, product.id), eq(productTranslations.locale, locale)))
          .limit(1)
          .then((r) => r[0] ?? null),
  ]);

  if (localeTrans) translation = localeTrans;
  const trans = translation;

  let related: {
    id: number;
    name: string;
    slug: string;
    shortDescription: string | null | undefined;
    modelNumber: string | null;
    imageUrl: string | null | undefined;
    isFeatured: boolean;
  }[] = [];

  if (product.categoryId) {
    const relatedProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, product.categoryId),
          ne(products.id, product.id),
          eq(products.isActive, true),
        ),
      )
      .limit(3);

    const relatedIds = relatedProducts.map((p) => p.id);

    if (relatedIds.length) {
      const [relTrans, relTransEn, relImages] = await Promise.all([
        db
          .select()
          .from(productTranslations)
          .where(and(inArray(productTranslations.productId, relatedIds), eq(productTranslations.locale, locale))),
        locale !== 'en'
          ? db
              .select()
              .from(productTranslations)
              .where(and(inArray(productTranslations.productId, relatedIds), eq(productTranslations.locale, 'en')))
          : Promise.resolve([]),
        db.select().from(productImages).where(inArray(productImages.productId, relatedIds)),
      ]);

      const relTransMap = new Map(relTrans.map((t) => [t.productId, t]));
      const relTransEnMap = new Map(relTransEn.map((t) => [t.productId, t]));
      const relImgMap = new Map<number, typeof relImages[number]>();
      for (const img of relImages) {
        const existing = relImgMap.get(img.productId);
        if (!existing || (img.isPrimary && !existing.isPrimary)) {
          relImgMap.set(img.productId, img);
        }
      }

      related = relatedProducts.map((p) => {
        const pTrans = relTransMap.get(p.id) || relTransEnMap.get(p.id);
        const pImg = relImgMap.get(p.id);
        return {
          id: p.id,
          name: pTrans?.name || 'Product',
          slug: pTrans?.slug || `product-${p.id}`,
          shortDescription: pTrans?.shortDescription,
          modelNumber: p.modelNumber,
          imageUrl: pImg?.imageUrl,
          isFeatured: p.isFeatured,
        };
      });
    }
  }

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
      (trans.fullDescription ? trans.fullDescription.replace(/<[^>]+>/g, '').slice(0, 500) : `${trans.name} — manufactured by ${SITE_NAME}.`),
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

      {/* Breadcrumb bar */}
      <div className="bg-cream border-b border-warm-border">
        <div className="container-wide py-5">
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center gap-2 text-[13px] font-body font-semibold text-ink-mid hover:text-ink tracking-[0.14em] uppercase transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.75} />
            {common('backToProducts')}
          </Link>
        </div>
      </div>

      {/* Product Detail */}
      <section className="bg-cream">
        <div className="container-wide py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Image Gallery */}
            <div className="lg:col-span-7">
              <ImageGallery images={imageUrls} productName={trans.name} />
            </div>

            {/* Product Info */}
            <div className="lg:col-span-5 lg:pt-4">
              {product.modelNumber && (
                <p className="text-[13px] font-body font-semibold text-bronze tracking-[0.18em] uppercase mb-4">
                  {t('modelNumber')} — {product.modelNumber}
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
                  <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5">
                    {t('specifications')}
                  </p>
                  <dl className="border-t border-warm-border">
                    {specs.map((spec) => (
                      <div key={spec.id} className="grid grid-cols-[140px_1fr] gap-4 py-4 border-b border-warm-border">
                        <dt className="text-[13px] font-body font-semibold text-ink-mid tracking-[0.08em] uppercase">
                          {spec.specKey}
                        </dt>
                        <dd className="text-[15px] font-body font-normal text-ink leading-[1.55]">
                          {spec.specValue}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* CTA */}
              <Link
                href={`/${locale}/contact?product=${encodeURIComponent(trans.name)}${
                  product.modelNumber ? `&model=${encodeURIComponent(product.modelNumber)}` : ''
                }`}
                className="btn-primary group"
              >
                {t('sendInquiry')}
                <ArrowRight size={14} strokeWidth={1.75} className="ml-3 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>

              {/* Full Description */}
              {trans.fullDescription && (
                <div className="mt-12 pt-10 border-t border-warm-border">
                  <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-5">
                    Details
                  </p>
                  <div
                    className="prose-content text-[16px]"
                    dangerouslySetInnerHTML={{ __html: trans.fullDescription }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-24 pt-14 border-t border-warm-border">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-[13px] font-body font-semibold text-bronze uppercase tracking-[0.18em] mb-3">
                    Related
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-[-0.015em] leading-[1.1]">
                    {t('relatedProducts')}
                  </h2>
                </div>
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
                  <ProductCard key={p.id} index={i} {...p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
