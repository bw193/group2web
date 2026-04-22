import { getTranslations } from 'next-intl/server';
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
  faqs,
  faqTranslations,
} from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import HeroBanner from '@/components/public/HeroBanner';
import FeaturedProductsSection from '@/components/public/FeaturedProductsSection';
import FacilitySection from '@/components/public/FacilitySection';
import CertificationsSection from '@/components/public/CertificationsSection';
import FaqSection from '@/components/public/FaqSection';
import { Users, Globe, FlaskConical, Factory } from 'lucide-react';

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

  // Fetch FAQs securely on the server
  const faqData = await db
    .select()
    .from(faqs)
    .where(eq(faqs.isActive, true))
    .orderBy(faqs.displayOrder);

  const faqIds = faqData.map((f) => f.id);

  const [faqTrans, faqTransEn] = await Promise.all([
    faqIds.length
      ? db
          .select()
          .from(faqTranslations)
          .where(and(inArray(faqTranslations.faqId, faqIds), eq(faqTranslations.locale, locale)))
      : Promise.resolve([]),
    faqIds.length && locale !== 'en'
      ? db
          .select()
          .from(faqTranslations)
          .where(and(inArray(faqTranslations.faqId, faqIds), eq(faqTranslations.locale, 'en')))
      : Promise.resolve([]),
  ]);

  const faqTransMap = new Map(faqTrans.map((t) => [t.faqId, t]));
  const faqTransEnMap = new Map(faqTransEn.map((t) => [t.faqId, t]));

  const finalFaqs = faqData.map((f) => {
    const t = faqTransMap.get(f.id) || faqTransEnMap.get(f.id);
    if (!t) return null;
    return { q: t.question, a: t.answer };
  }).filter((x): x is { q: string; a: string } => !!x);

  const capabilities = [
    { title: t('service1Title'), desc: t('service1Desc'), Icon: Users },
    { title: t('service2Title'), desc: t('service2Desc'), Icon: Globe },
    { title: t('service3Title'), desc: t('service3Desc'), Icon: FlaskConical },
    { title: t('service4Title'), desc: t('service4Desc'), Icon: Factory },
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

      {/* Capabilities — compact four-column plinth seamed into the hero */}
      <section className="relative bg-cream border-b border-warm-border -mt-8 md:-mt-10 z-10 shadow-[0_-18px_48px_-40px_rgba(20,18,14,0.28)]">
        <div className="container-wide pt-6 pb-10 md:pt-8 md:pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" data-reveal-stagger>
            {capabilities.map((item, i) => {
              const Icon = item.Icon;
              return (
                <div
                  key={i}
                  className={`group relative py-5 md:py-3 md:px-8 lg:px-10 first:md:pl-0 last:md:pr-0 ${
                    i < capabilities.length - 1 ? 'border-b md:border-b-0 md:border-r border-warm-border' : ''
                  }`}
                  data-reveal
                >
                  <div className="mb-3">
                    <Icon
                      size={20}
                      strokeWidth={1.25}
                      className="text-bronze transition-transform duration-700 ease-out group-hover:-translate-y-0.5"
                    />
                  </div>
                  <h3 className="font-display text-lg md:text-xl font-light text-ink leading-tight mb-1.5 tracking-[-0.01em]">
                    {item.title}
                  </h3>
                  <p className="text-[13px] font-body font-light text-ink-mid leading-[1.65] max-w-xs">
                    {item.desc}
                  </p>
                </div>
              );
            })}
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

      {/* FAQ — Inquiries */}
      <FaqSection backendFaqs={finalFaqs} />

      {/* Certifications */}
      <CertificationsSection images={certPhotos.map((p) => p.imageUrl)} />
    </>
  );
}
