import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import {
  banners,
  bannerTranslations,
  products,
  productTranslations,
  productImages,
  productCategories,
  categoryTranslations,
  aboutGallery,
} from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import HeroBanner from '@/components/public/HeroBanner';
import FeaturedProductsSection from '@/components/public/FeaturedProductsSection';
import FacilitySection from '@/components/public/FacilitySection';
import CertificationsSection from '@/components/public/CertificationsSection';
import { Users, Globe, ClipboardCheck, Package } from 'lucide-react';

export const revalidate = 300; // ISR: rebuild at most every 5 minutes

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('home');
  const db = getDb();

  // Fetch banners, featured products, categories, factory photos, and certs in parallel
  const [bannerData, featuredProducts, allCats, facilityPhoto, certPhotos] = await Promise.all([
    db
      .select()
      .from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(banners.displayOrder),
    db
      .select()
      .from(products)
      .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt))
      .limit(12),
    db
      .select()
      .from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(productCategories.displayOrder),
    db
      .select()
      .from(aboutGallery)
      .where(eq(aboutGallery.imageType, 'factory'))
      .orderBy(aboutGallery.displayOrder)
      .limit(4),
    db
      .select()
      .from(aboutGallery)
      .where(eq(aboutGallery.imageType, 'certification'))
      .orderBy(aboutGallery.displayOrder)
      .limit(8),
  ]);

  const bannerIds = bannerData.map((b) => b.id);
  const productIds = featuredProducts.map((p) => p.id);
  const catIds = allCats.map((c) => c.id);

  // Batch all translation + image queries in parallel
  const [bannerTrans, productTrans, productTransEn, productImgs, catTrans, catTransEn] =
    await Promise.all([
      bannerIds.length
        ? db
            .select()
            .from(bannerTranslations)
            .where(and(inArray(bannerTranslations.bannerId, bannerIds), eq(bannerTranslations.locale, locale)))
        : Promise.resolve([]),
      productIds.length
        ? db
            .select()
            .from(productTranslations)
            .where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, locale)))
        : Promise.resolve([]),
      productIds.length && locale !== 'en'
        ? db
            .select()
            .from(productTranslations)
            .where(and(inArray(productTranslations.productId, productIds), eq(productTranslations.locale, 'en')))
        : Promise.resolve([]),
      productIds.length
        ? db.select().from(productImages).where(inArray(productImages.productId, productIds))
        : Promise.resolve([]),
      catIds.length
        ? db
            .select()
            .from(categoryTranslations)
            .where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, locale)))
        : Promise.resolve([]),
      catIds.length && locale !== 'en'
        ? db
            .select()
            .from(categoryTranslations)
            .where(and(inArray(categoryTranslations.categoryId, catIds), eq(categoryTranslations.locale, 'en')))
        : Promise.resolve([]),
    ]);

  const bannerTransMap = new Map(bannerTrans.map((t) => [t.bannerId, t]));
  const productTransMap = new Map(productTrans.map((t) => [t.productId, t]));
  const productTransEnMap = new Map(productTransEn.map((t) => [t.productId, t]));

  // Pick primary image (or first) per product
  const primaryImgMap = new Map<number, typeof productImgs[number]>();
  for (const img of productImgs) {
    const existing = primaryImgMap.get(img.productId);
    if (!existing || (img.isPrimary && !existing.isPrimary)) {
      primaryImgMap.set(img.productId, img);
    }
  }

  const bannerSlides = bannerData.map((b) => {
    const trans = bannerTransMap.get(b.id);
    return {
      id: b.id,
      imageUrl: b.imageUrl,
      title: trans?.title,
      subtitle: trans?.subtitle,
      ctaText: trans?.ctaText,
      ctaLink: b.ctaLink,
    };
  });

  const featuredWithDetails = featuredProducts.map((p) => {
    const trans = productTransMap.get(p.id) || productTransEnMap.get(p.id);
    const primaryImg = primaryImgMap.get(p.id);
    return {
      id: p.id,
      name: trans?.name || 'Product',
      slug: trans?.slug || `product-${p.id}`,
      shortDescription: trans?.shortDescription,
      modelNumber: p.modelNumber,
      imageUrl: primaryImg?.imageUrl,
      isFeatured: true,
      categoryId: p.categoryId,
    };
  });

  const catTransMap = new Map(catTrans.map((t) => [t.categoryId, t]));
  const catTransEnMap = new Map(catTransEn.map((t) => [t.categoryId, t]));
  const categoryOptions = allCats.map((c) => ({
    id: c.id,
    name: catTransMap.get(c.id)?.name || catTransEnMap.get(c.id)?.name || `Category ${c.id}`,
  }));

  const capabilities = [
    { icon: Users, title: t('service1Title'), desc: t('service1Desc') },
    { icon: Globe, title: t('service2Title'), desc: t('service2Desc') },
    { icon: ClipboardCheck, title: t('service3Title'), desc: t('service3Desc') },
    { icon: Package, title: t('service4Title'), desc: t('service4Desc') },
  ];

  return (
    <>
      {/* Hero Banner */}
      <HeroBanner
        slides={bannerSlides}
        fallbackTitle={t('heroTitle')}
        fallbackSubtitle={t('heroSubtitle')}
        fallbackCta={t('heroCta')}
      />

      {/* Capabilities Strip */}
      <section className="relative bg-cream border-b border-warm-border overflow-hidden">
        {/* Subtle dotted texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, #9A8266 0.5px, transparent 0.5px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="container-wide relative">
          <div className="grid grid-cols-2 lg:grid-cols-4" data-reveal-stagger>
            {capabilities.map((item, i) => (
              <div
                key={i}
                className={`relative px-5 md:px-8 py-6 md:py-7 group transition-colors duration-700 hover:bg-bronze-subtle/40 ${
                  i < capabilities.length - 1 ? 'lg:border-r border-warm-border' : ''
                } ${i < 2 ? 'border-b lg:border-b-0 border-warm-border' : ''} ${
                  i % 2 === 0 ? 'border-r lg:border-r' : ''
                }`}
                data-reveal
              >
                {/* Numeric eyebrow */}
                <span className="absolute top-3 left-5 md:left-8 text-[10px] font-body font-light text-ink-light tracking-[0.3em]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {/* Corner accent */}
                <span className="absolute top-3 right-5 md:right-8 w-4 h-px bg-bronze/40 transition-all duration-500 group-hover:w-8 group-hover:bg-bronze" />

                <div className="flex flex-col items-center text-center">
                  <div className="relative w-10 h-10 flex items-center justify-center mb-3">
                    {/* Decorative ring */}
                    <span className="absolute inset-0 border border-warm-border transition-all duration-500 group-hover:border-bronze group-hover:rotate-45" />
                    <span className="absolute inset-1 border border-transparent transition-all duration-700 group-hover:border-bronze/30 group-hover:-rotate-45" />
                    <item.icon
                      className="text-bronze relative transition-transform duration-500 group-hover:scale-110"
                      size={18}
                      strokeWidth={1.25}
                    />
                  </div>

                  <h3 className="font-display text-base md:text-lg font-medium text-ink leading-tight mb-1.5">
                    {item.title}
                  </h3>
                  <div className="w-5 h-px bg-bronze/40 mb-1.5 transition-all duration-500 group-hover:w-10 group-hover:bg-bronze" />
                  <p className="text-[10px] md:text-[11px] font-body font-light text-ink-mid tracking-[0.15em] uppercase">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <FeaturedProductsSection
        products={featuredWithDetails}
        categories={categoryOptions}
        locale={locale}
        maxVisible={8}
      />


      {/* Factory & Numbers — editorial feature */}
      <FacilitySection
        locale={locale}
        images={facilityPhoto.map((p) => p.imageUrl)}
      />

      {/* Certifications */}
      <CertificationsSection images={certPhotos.map((p) => p.imageUrl)} />

      {/* Inquiry CTA */}
      <section className="py-24 md:py-32 bg-espresso text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #C4AD8F 0.5px, transparent 0.5px)',
          backgroundSize: '32px 32px'
        }} />
        <div className="container-wide relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-medium mb-6" data-reveal>
            {t('inquiryCta')}
          </h2>
          <p className="text-base font-body font-light text-cream/60 mb-10 max-w-xl mx-auto leading-relaxed" data-reveal>
            {t('inquiryCtaDesc')}
          </p>
          <div data-reveal>
            <Link
              href={`/${locale}/contact`}
              className="btn-accent text-sm uppercase tracking-[0.12em] px-12 py-4"
            >
              {t('inquiryCtaBtn')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
