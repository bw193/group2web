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
import FaqSection from '@/components/public/FaqSection';
import WordsReveal from '@/components/public/WordsReveal';
import MagneticLink from '@/components/public/MagneticLink';
import { Users, Globe, ClipboardCheck, Package, ArrowRight } from 'lucide-react';

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
      .orderBy(aboutGallery.displayOrder),
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

      {/* Capabilities Strip — animated soft blob + lift on hover */}
      <section className="relative bg-cream py-16 md:py-20 overflow-hidden">
        <span
          className="blob blob-b"
          style={{ width: 460, height: 460, top: '-180px', left: '50%', transform: 'translateX(-50%)' }}
          aria-hidden
        />
        <div className="container-wide relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 md:gap-14" data-reveal-stagger>
            {capabilities.map((item, i) => (
              <div
                key={i}
                className="group flex flex-col items-center text-center cursor-default"
                data-reveal
              >
                <div className="relative w-14 h-14 mb-5 flex items-center justify-center">
                  {/* Concentric animated rings */}
                  <span className="absolute inset-0 rounded-full border border-bronze/20 transition-all duration-700 group-hover:scale-110 group-hover:border-bronze/60" />
                  <span className="absolute inset-2 rounded-full border border-bronze/10 transition-all duration-1000 group-hover:scale-125 group-hover:border-bronze/40" />
                  <item.icon
                    className="text-bronze relative transition-all duration-500 group-hover:-translate-y-0.5 group-hover:scale-110"
                    size={22}
                    strokeWidth={1.25}
                  />
                </div>
                <h3 className="font-display text-lg font-medium text-ink leading-tight transition-colors duration-500 group-hover:text-bronze">
                  {item.title}
                </h3>
                <span className="block w-0 h-px bg-bronze mt-2 transition-all duration-500 group-hover:w-8" />
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

      {/* FAQ — Inquiries */}
      <FaqSection />

      {/* Inquiry CTA — dramatic dark close */}
      <section className="relative py-32 md:py-48 bg-ink text-cream overflow-hidden">
        {/* Bronze wash */}
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.10]"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(205,185,154,1), transparent 70%)',
          }}
        />
        {/* Layered atmosphere */}
        <span className="blob blob-a" style={{ width: 700, height: 700, top: '-200px', left: '50%', transform: 'translateX(-50%)', opacity: 0.35 }} aria-hidden />
        <span className="blob blob-c" style={{ width: 380, height: 380, bottom: '-100px', right: '10%', opacity: 0.3 }} aria-hidden />

        {/* Spinning decorative ring */}
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] md:w-[680px] md:h-[680px] rounded-full border border-bronze-light/20 animate-spin-slow pointer-events-none"
        />

        <div className="container-wide relative text-center">
          <p
            className="text-[11px] font-body text-bronze-light tracking-[0.4em] uppercase mb-8 animate-float"
            data-reveal
          >
            Let's begin
          </p>

          <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-light leading-[0.95] text-cream max-w-4xl mx-auto">
            <WordsReveal text={t('inquiryCta')} />
          </h2>

          <div className="mt-14" data-reveal>
            <MagneticLink
              href={`/${locale}/contact`}
              className="group inline-flex items-center gap-4 px-10 py-5 bg-cream text-ink hover:bg-bronze-light rounded-full text-[12px] font-body font-medium tracking-[0.2em] uppercase transition-colors duration-700"
              strength={0.45}
            >
              {t('inquiryCtaBtn')}
              <ArrowRight size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
            </MagneticLink>
          </div>
        </div>
      </section>
    </>
  );
}
