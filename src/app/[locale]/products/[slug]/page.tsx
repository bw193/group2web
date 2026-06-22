import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { products, productTranslations, productSpecifications, productImages } from '@/lib/db/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { getBuildSnapshot, type BuildSnapshot } from '@/lib/build-cache';
import { getUploadUrl } from '@/lib/utils';
import { ArrowRight, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/public/ProductCard';
import ProofPoints from '@/components/public/ProofPoints';
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
import { locales, defaultLocale, localeHomePath } from '@/i18n/config';

export const revalidate = 600;

type ProductRow = BuildSnapshot['products'][number];
type ProductTranslationRow = BuildSnapshot['productTranslations'][number];
type ProductImageRow = BuildSnapshot['productImages'][number];

// Snapshot-side helper: replicate the SQL "INNER JOIN ... WHERE slug AND
// locale AND isActive" lookup against the in-memory indices.
function snapJoinedByLocaleSlug(
  snap: BuildSnapshot,
  locale: string,
  slug: string,
): { product: ProductRow; trans: ProductTranslationRow } | null {
  const trans = snap.indices.productTransByLocaleSlug.get(`${locale}|${slug}`);
  if (!trans) return null;
  const product = snap.indices.productById.get(trans.productId);
  if (!product || !product.isActive) return null;
  return { product, trans };
}

// Snapshot-side helper: "find this slug in ANY locale where the product is
// active" — mirrors the per-locale-redirect fallback path on a slug miss.
function snapJoinedBySlugAny(
  snap: BuildSnapshot,
  slug: string,
): { product: ProductRow; trans: ProductTranslationRow } | null {
  const candidates = snap.indices.productTransBySlug.get(slug) ?? [];
  for (const trans of candidates) {
    const product = snap.indices.productById.get(trans.productId);
    if (product && product.isActive) return { product, trans };
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const snap = await getBuildSnapshot();

  if (snap) {
    // Snapshot path — no try/catch around it. A snapshot bug must surface as
    // a build failure rather than be masked as a generic-title page.
    const hit = snapJoinedByLocaleSlug(snap, locale, slug);
    if (!hit) {
      return { title: productTitle('Product'), robots: { index: false, follow: true } };
    }

    const allTrans = snap.productTranslations.filter((t) => t.productId === hit.product.id);

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

    const imgs = snap.indices.productImagesByProduct.get(hit.product.id) ?? [];
    // imgs is sorted by displayOrder — match the SQL ORDER BY + LIMIT 1.
    const ogImage = imgs[0]?.imageUrl ? getUploadUrl(imgs[0].imageUrl) : SITE_OG_IMAGE;

    const title = productTitle(hit.trans.name);
    const description = hit.trans.shortDescription
      ? hit.trans.shortDescription.slice(0, 300)
      : `${hit.trans.name}${hit.product.modelNumber ? ` (Model ${hit.product.modelNumber})` : ''} — manufactured by Chengtai Mirror, Jiaxing, China. OEM/ODM available.`;

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
        images: [{ url: ogImage, width: 1200, height: 630, alt: hit.trans.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  }

  // Runtime ISR path — no try/catch masking per [[no-fallback-masking]]; a real
  // DB outage should propagate rather than ship pages with generic titles.
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
    return { title: productTitle('Product'), robots: { index: false, follow: true } };
  }

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
}

export async function generateStaticParams() {
  const snap = await getBuildSnapshot();
  if (snap) {
    // No try/catch — a missing snapshot here would silently ship a site
    // with zero product pages (see [[no-fallback-masking]]).
    return snap.productTranslations.map((r) => ({ locale: r.locale, slug: r.slug }));
  }

  const db = getDb();
  const rows = await db
    .select({ locale: productTranslations.locale, slug: productTranslations.slug })
    .from(productTranslations);
  return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('products');
  const breadcrumbT = await getTranslations('breadcrumb');
  const snap = await getBuildSnapshot();

  // ---------------------------------------------------------------------
  // Snapshot path — pure in-memory; mirrors every WHERE / ORDER BY below.
  // ---------------------------------------------------------------------
  let product: ProductRow | undefined;
  let translation: ProductTranslationRow | undefined;
  let specs: BuildSnapshot['productSpecifications'][number][] = [];
  let images: ProductImageRow[] = [];
  let related: {
    id: number;
    name: string;
    slug: string;
    shortDescription: string | null | undefined;
    modelNumber: string | null;
    imageUrl: string | null | undefined;
    isFeatured: boolean;
  }[] = [];

  if (snap) {
    const hit = snapJoinedByLocaleSlug(snap, locale, slug);
    if (hit) {
      product = hit.product;
      translation = hit.trans;
    } else {
      // Slug not present in requested locale. Find it in ANY locale.
      const any = snapJoinedBySlugAny(snap, slug);
      if (!any) notFound();

      const localizedSlugRow = snap.indices.productTransByProductLocale.get(
        `${any.product.id}|${locale}`,
      );
      if (localizedSlugRow?.slug && localizedSlugRow.slug !== slug) {
        permanentRedirect(localizedPath(locale, `/products/${localizedSlugRow.slug}`));
      }

      // No translation for this locale — render whatever we have to avoid 404,
      // matching the legacy behavior; metadata fallback handles noindex.
      product = any.product;
      translation = any.trans;
    }
    if (!product || !translation) notFound();

    specs = snap.indices.productSpecsByProductLocale.get(`${product.id}|${locale}`) ?? [];

    // Match SQL ORDER BY productImages.displayOrder; the index pre-sorts.
    images = snap.indices.productImagesByProduct.get(product.id) ?? [];

    // If the joined row above was a fallback-locale (the slug existed under
    // another locale and we did NOT permanentRedirect), the locale-specific
    // translation may still exist with a DIFFERENT slug — promote it now to
    // match the legacy Promise.all behavior.
    if (translation.locale !== locale) {
      const localeTrans = snap.indices.productTransByProductLocale.get(`${product.id}|${locale}`);
      if (localeTrans) translation = localeTrans;
    }

    if (product.categoryId) {
      // Mirror SQL: WHERE categoryId = ? AND id != ? AND isActive; LIMIT 3.
      // The legacy code did NOT add an ORDER BY, so Postgres returned whatever
      // order it pleased. Match that exactly: filter by category + id + active,
      // take the first 3 in insertion (id) order — Postgres without ORDER BY
      // is undefined, but products are inserted in id ASC and that's the
      // stable order observed in prod HTML.
      const relatedProducts = snap.products
        .filter(
          (p) => p.categoryId === product!.categoryId && p.id !== product!.id && p.isActive,
        )
        .slice(0, 3);

      if (relatedProducts.length) {
        related = relatedProducts.map((p) => {
          const trans =
            snap.indices.productTransByProductLocale.get(`${p.id}|${locale}`) ??
            (locale !== 'en'
              ? snap.indices.productTransByProductLocale.get(`${p.id}|en`)
              : undefined);
          const imgs = snap.indices.productImagesByProduct.get(p.id) ?? [];
          let chosenImg: ProductImageRow | undefined = undefined;
          for (const img of imgs) {
            if (!chosenImg || (img.isPrimary && !chosenImg.isPrimary)) chosenImg = img;
          }
          return {
            id: p.id,
            name: trans?.name || 'Product',
            slug: trans?.slug || `product-${p.id}`,
            shortDescription: trans?.shortDescription,
            modelNumber: p.modelNumber,
            imageUrl: chosenImg?.imageUrl,
            isFeatured: p.isFeatured,
          };
        });
      }
    }
  } else {
    // -------------------------------------------------------------------
    // Runtime ISR / dev path — verbatim Drizzle queries from before.
    // -------------------------------------------------------------------
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

    product = joined[0]?.product;
    translation = joined[0]?.trans;

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
        permanentRedirect(localizedPath(locale, `/products/${localizedSlugRow[0].slug}`));
      }

      // No translation for this locale — render whatever we have to avoid 404,
      // but mark the page noindex via metadata fallback. (notFound is harsher.)
      product = target.product;
      translation = target.trans;
    }
    if (!product || !translation) notFound();

    const [specsRow, imagesRow, localeTrans] = await Promise.all([
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
    specs = specsRow;
    images = imagesRow;

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
  }

  // Above both paths converge: product, translation, specs, images, related.
  const trans = translation;

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

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-cream border-b border-warm-border">
        <div className="container-wide py-4">
          <ol className="flex items-center gap-2.5 text-[12px] font-body font-semibold tracking-[0.12em] uppercase">
            <li className="flex-shrink-0">
              <Link href={localeHomePath(locale)} className="text-ink-mid hover:text-ink transition-colors duration-300">
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

          {/* Trust strip — the three manufacturer proof points, shared with the
              homepage factory section. Presentational only (no Product JSON-LD
              change), so repeating it across product pages stays SEO-neutral. */}
          <ProofPoints className="mt-16 pt-12 md:mt-20 md:pt-14 border-t border-warm-border" noSnippet />

          {/* Full Description — intentionally not gated behind data-reveal:
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
        </div>
      </section>
    </>
  );
}
