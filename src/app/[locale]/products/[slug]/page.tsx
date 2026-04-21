import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { products, productTranslations, productSpecifications, productImages } from '@/lib/db/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { getUploadUrl } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/public/ProductCard';
import ImageGallery from './ImageGallery';

export const revalidate = 600; // ISR: rebuild at most every 10 minutes

// Pre-render every (locale, slug) at build time so visits hit the CDN
// instead of running SSR + DB queries on demand. Falls back to on-demand
// generation for any slug not known at build time.
export async function generateStaticParams() {
  try {
    const db = getDb();
    const rows = await db
      .select({ locale: productTranslations.locale, slug: productTranslations.slug })
      .from(productTranslations);
    return rows.map((r) => ({ locale: r.locale, slug: r.slug }));
  } catch {
    // If the DB is unreachable at build time, fall back to on-demand rendering
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
  const db = getDb();

  // Happy path: one JOIN query gets product + translation in a single round trip.
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

  // Fallback: slug exists in a different locale. Rare, keeps old behavior.
  if (!product) {
    const any = await db
      .select({ product: products, trans: productTranslations })
      .from(productTranslations)
      .innerJoin(products, eq(products.id, productTranslations.productId))
      .where(and(eq(productTranslations.slug, slug), eq(products.isActive, true)))
      .limit(1);
    product = any[0]?.product;
    translation = any[0]?.trans;
  }
  if (!product || !translation) notFound();

  // Fetch specs, images, and (if fallback happened) this-locale translation in parallel.
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
  // Keep `trans` alias for downstream references below.
  const trans = translation;

  // Related products — batch fetch
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
          eq(products.isActive, true)
        )
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

  return (
    <div className="pt-20 md:pt-24">
      {/* Breadcrumb bar */}
      <div className="bg-sand border-b border-warm-border">
        <div className="container-wide py-4">
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center gap-2 text-xs font-body font-medium text-ink-mid hover:text-ink tracking-[0.08em] uppercase transition-colors"
          >
            <ArrowLeft size={14} />
            {common('backToProducts')}
          </Link>
        </div>
      </div>

      {/* Product Detail */}
      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
            {/* Image Gallery */}
            <ImageGallery images={imageUrls} productName={translation.name} />

            {/* Product Info */}
            <div className="lg:pt-4">
              {product.modelNumber && (
                <p className="text-[11px] font-body text-ink-light tracking-[0.15em] uppercase mb-3">
                  {t('modelNumber')}: {product.modelNumber}
                </p>
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium leading-tight mb-6">
                {translation.name}
              </h1>
              {translation.shortDescription && (
                <p className="text-ink-mid font-body font-light leading-relaxed text-lg mb-8">
                  {translation.shortDescription}
                </p>
              )}

              <div className="w-12 h-px bg-bronze mb-8" />

              {/* Specifications */}
              {specs.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-lg font-display font-medium mb-5 tracking-wide">
                    {t('specifications')}
                  </h2>
                  <div className="border-t border-warm-border">
                    {specs.map((spec) => (
                      <div key={spec.id} className="flex border-b border-warm-border">
                        <div className="w-2/5 py-3.5 pr-4 text-sm font-body font-medium text-ink">
                          {spec.specKey}
                        </div>
                        <div className="w-3/5 py-3.5 pl-4 text-sm font-body font-light text-ink-mid border-l border-warm-border">
                          {spec.specValue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <Link
                href={`/${locale}/contact?product=${encodeURIComponent(translation.name)}`}
                className="btn-primary text-sm uppercase tracking-[0.12em] group"
              >
                {t('sendInquiry')}
                <ArrowRight size={15} className="ml-3 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Full Description */}
              {translation.fullDescription && (
                <div className="mt-12 pt-10 border-t border-warm-border">
                  <div
                    className="prose-content text-sm"
                    dangerouslySetInnerHTML={{ __html: translation.fullDescription }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-24 pt-16 border-t border-warm-border">
              <h2 className="text-3xl font-display font-medium mb-12">{t('relatedProducts')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {related.map((p) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
