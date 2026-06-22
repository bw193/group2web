import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
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
import { getBuildSnapshot } from '@/lib/build-cache';
import HeroBanner from '@/components/public/HeroBanner';
import FeaturedProductsSection from '@/components/public/FeaturedProductsSection';
import CustomizationWorkflowSection from '@/components/public/CustomizationWorkflowSection';
import FacilitySection from '@/components/public/FacilitySection';
import CertificationsSection from '@/components/public/CertificationsSection';
import WorldwideExhibitionSection from '@/components/public/WorldwideExhibitionSection';
import FaqSection from '@/components/public/FaqSection';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  ADDRESS,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SITE_LEGAL_NAME,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
  buildAlternates,
  localeToOg,
  localizedUrl,
  pageCopy,
} from '@/lib/seo';
import { Users, Globe, FlaskConical, Factory } from 'lucide-react';

export const revalidate = 300; // ISR: rebuild at most every 5 minutes

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = pageCopy(locale, 'home');
  const url = localizedUrl(locale, '');

  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(locale, ''),
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

// FAQ fallback used both by the client UI and JSON-LD when DB is empty.
const FALLBACK_FAQ_FOR_SEO: { q: string; a: string }[] = [
  { q: 'Do you accept sample orders?', a: 'Yes — we support our customers in ordering samples to test quality and function before placing a full production order.' },
  { q: 'What is your typical lead time?', a: 'Generally 10–15 days for standard orders. Larger volumes are scheduled with you in advance.' },
  { q: 'Do you have an MOQ restriction?', a: 'Low MOQ — even a single piece is acceptable for sample checking.' },
  { q: 'Do you operate your own factory?', a: 'Yes. Fifteen years specializing in mirror manufacturing — LED, bathroom, dressing, and full mirror cabinets, all in-house.' },
  { q: 'Can we print our own logo on the products?', a: 'Yes. Confirm the design against our pre-production sample and let us know before production begins.' },
  { q: 'Do you offer a warranty on the products?', a: 'Every product ships with a two-year warranty.' },
];

// Shape that both code paths converge on. Keeping a single produce-then-render
// flow means the JSX only references locals, not the snapshot/db origin.
type BannerSlide = {
  id: number;
  imageUrl: string;
  title: string | undefined;
  subtitle: string | undefined;
  ctaText: string | undefined;
  ctaLink: string | null;
};
type FeaturedItem = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null | undefined;
  modelNumber: string | null;
  imageUrl: string | null | undefined;
  isFeatured: true;
  categoryId: number | null;
};
type CategoryOption = { id: number; name: string };
type ExhibitionPhoto = { imageUrl: string; caption: string | null };

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const snap = await getBuildSnapshot();

  let bannerSlides: BannerSlide[];
  let featuredWithDetails: FeaturedItem[];
  let categoryOptions: CategoryOption[];
  let facilityImages: string[];
  let certImages: string[];
  let exhibitionPhotos: ExhibitionPhoto[];
  let finalFaqs: { q: string; a: string }[];

  if (snap) {
    // -------------------------------------------------------------------
    // Snapshot path. Each block mirrors the corresponding SQL filter and
    // ORDER BY exactly — the home page renders ~17 different shapes, and
    // any drift here becomes a visible HTML diff.
    // -------------------------------------------------------------------

    // banners: WHERE isActive ORDER BY displayOrder.
    const bannerData = snap.banners
      .filter((b) => b.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // products (featured): WHERE isFeatured AND isActive ORDER BY createdAt DESC LIMIT 200.
    const featuredProducts = snap.products
      .filter((p) => p.isFeatured && p.isActive)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 200);

    // productCategories: WHERE isActive ORDER BY displayOrder.
    const allCats = snap.productCategories
      .filter((c) => c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // aboutGallery 'factory' ORDER BY displayOrder LIMIT 8.
    const facilityPhoto = (snap.indices.aboutGalleryByType.get('factory') ?? []).slice(0, 8);
    // aboutGallery 'certification' ORDER BY displayOrder.
    const certPhotos = snap.indices.aboutGalleryByType.get('certification') ?? [];
    // aboutGallery 'exhibition' ORDER BY displayOrder.
    const exhibitionRows = snap.indices.aboutGalleryByType.get('exhibition') ?? [];

    bannerSlides = bannerData.map((b) => {
      const tr = snap.indices.bannerTransByBannerLocale.get(`${b.id}|${locale}`);
      return {
        id: b.id,
        imageUrl: b.imageUrl,
        title: tr?.title ?? undefined,
        subtitle: tr?.subtitle ?? undefined,
        ctaText: tr?.ctaText ?? undefined,
        ctaLink: b.ctaLink,
      };
    });

    featuredWithDetails = featuredProducts.map((p) => {
      const tr =
        snap.indices.productTransByProductLocale.get(`${p.id}|${locale}`) ??
        (locale !== 'en'
          ? snap.indices.productTransByProductLocale.get(`${p.id}|en`)
          : undefined);
      const imgs = snap.indices.productImagesByProduct.get(p.id) ?? [];
      // Match "isPrimary wins, else first" — same rule as the Drizzle path.
      let primaryImg: (typeof imgs)[number] | undefined = undefined;
      for (const img of imgs) {
        if (!primaryImg || (img.isPrimary && !primaryImg.isPrimary)) primaryImg = img;
      }
      return {
        id: p.id,
        name: tr?.name || 'Product',
        slug: tr?.slug || `product-${p.id}`,
        shortDescription: tr?.shortDescription,
        modelNumber: p.modelNumber,
        imageUrl: primaryImg?.imageUrl,
        isFeatured: true as const,
        categoryId: p.categoryId,
      };
    });

    categoryOptions = allCats.map((c) => {
      const tr =
        snap.indices.categoryTransByCategoryLocale.get(`${c.id}|${locale}`) ??
        (locale !== 'en'
          ? snap.indices.categoryTransByCategoryLocale.get(`${c.id}|en`)
          : undefined);
      return { id: c.id, name: tr?.name || `Category ${c.id}` };
    });

    facilityImages = facilityPhoto.map((p) => p.imageUrl);
    certImages = certPhotos.map((p) => p.imageUrl);
    exhibitionPhotos = exhibitionRows.map((r) => ({ imageUrl: r.imageUrl, caption: r.caption }));

    // faqs: WHERE isActive ORDER BY displayOrder.
    const faqData = snap.faqs
      .filter((f) => f.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    finalFaqs = faqData.flatMap((f) => {
      const tr =
        snap.indices.faqTransByFaqLocale.get(`${f.id}|${locale}`) ??
        (locale !== 'en'
          ? snap.indices.faqTransByFaqLocale.get(`${f.id}|en`)
          : undefined);
      return tr ? [{ q: tr.question, a: tr.answer }] : [];
    });
  } else {
    // -------------------------------------------------------------------
    // Runtime ISR / dev path — verbatim Drizzle queries.
    // -------------------------------------------------------------------
    const db = getDb();

    // Fetch banners, featured products, categories, factory photos, certs and
    // exhibition photos in parallel. All 6 queries hit the same Supavisor pool —
    // adding the 6th to this batch does NOT cost an extra round trip; it's one
    // small scan on the same about_gallery rows already in cache.
    const [bannerData, featuredProducts, allCats, facilityPhoto, certPhotos, exhibitionRows] = await Promise.all([
      db
        .select()
        .from(banners)
        .where(eq(banners.isActive, true))
        .orderBy(banners.displayOrder),
      // Fetch the full featured set. FeaturedProductsSection caps the visible
      // grid at maxVisible=8 per tab, but it derives the category TABS from the
      // categories present in this list — so a too-small limit silently drops
      // categories whenever the newest items bunch into a few. (88 featured
      // across 4 categories was collapsing to 2 under limit 60: LED + Full-Length
      // alone fill the newest 74.) 200 sits above the whole catalog, so no
      // category with a featured item is ever cut.
      db
        .select()
        .from(products)
        .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
        .orderBy(desc(products.createdAt))
        .limit(200),
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
        .limit(8),
      db
        .select()
        .from(aboutGallery)
        .where(eq(aboutGallery.imageType, 'certification'))
        .orderBy(aboutGallery.displayOrder),
      db
        .select({
          imageUrl: aboutGallery.imageUrl,
          caption: aboutGallery.caption,
        })
        .from(aboutGallery)
        .where(eq(aboutGallery.imageType, 'exhibition'))
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

    const bannerTransMap = new Map(bannerTrans.map((tr) => [tr.bannerId, tr]));
    const productTransMap = new Map(productTrans.map((tr) => [tr.productId, tr]));
    const productTransEnMap = new Map(productTransEn.map((tr) => [tr.productId, tr]));

    const primaryImgMap = new Map<number, typeof productImgs[number]>();
    for (const img of productImgs) {
      const existing = primaryImgMap.get(img.productId);
      if (!existing || (img.isPrimary && !existing.isPrimary)) {
        primaryImgMap.set(img.productId, img);
      }
    }

    bannerSlides = bannerData.map((b) => {
      const tr = bannerTransMap.get(b.id);
      return {
        id: b.id,
        imageUrl: b.imageUrl,
        title: tr?.title ?? undefined,
        subtitle: tr?.subtitle ?? undefined,
        ctaText: tr?.ctaText ?? undefined,
        ctaLink: b.ctaLink,
      };
    });

    featuredWithDetails = featuredProducts.map((p) => {
      const tr = productTransMap.get(p.id) || productTransEnMap.get(p.id);
      const primaryImg = primaryImgMap.get(p.id);
      return {
        id: p.id,
        name: tr?.name || 'Product',
        slug: tr?.slug || `product-${p.id}`,
        shortDescription: tr?.shortDescription,
        modelNumber: p.modelNumber,
        imageUrl: primaryImg?.imageUrl,
        isFeatured: true as const,
        categoryId: p.categoryId,
      };
    });

    const catTransMap = new Map(catTrans.map((tr) => [tr.categoryId, tr]));
    const catTransEnMap = new Map(catTransEn.map((tr) => [tr.categoryId, tr]));
    categoryOptions = allCats.map((c) => ({
      id: c.id,
      name: catTransMap.get(c.id)?.name || catTransEnMap.get(c.id)?.name || `Category ${c.id}`,
    }));

    facilityImages = facilityPhoto.map((p) => p.imageUrl);
    certImages = certPhotos.map((p) => p.imageUrl);
    exhibitionPhotos = exhibitionRows;

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

    const faqTransMap = new Map(faqTrans.map((tr) => [tr.faqId, tr]));
    const faqTransEnMap = new Map(faqTransEn.map((tr) => [tr.faqId, tr]));

    finalFaqs = faqData.flatMap((f) => {
      const tr = faqTransMap.get(f.id) || faqTransEnMap.get(f.id);
      return tr ? [{ q: tr.question, a: tr.answer }] : [];
    });
  }

  const capabilities = [
    { title: t('service1Title'), desc: t('service1Desc'), Icon: Users },
    { title: t('service2Title'), desc: t('service2Desc'), Icon: Globe },
    { title: t('service3Title'), desc: t('service3Desc'), Icon: FlaskConical },
    { title: t('service4Title'), desc: t('service4Desc'), Icon: Factory },
  ];

  // FAQs for JSON-LD: prefer DB content; fall back to the same list the
  // client component shows so structured data is always present.
  const seoFaqs = finalFaqs.length > 0 ? finalFaqs : FALLBACK_FAQ_FOR_SEO;

  const organization = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_LEGAL_NAME,
    alternateName: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO_URL,
    foundingDate: '2005',
    address: { '@type': 'PostalAddress', ...ADDRESS },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE,
        areaServed: 'Worldwide',
        availableLanguage: ['English', 'Spanish', 'Portuguese', 'French', 'Italian', 'German', 'Hebrew'],
      },
    ],
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${localizedUrl(locale, '/products')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: seoFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const homeCopy = pageCopy(locale, 'home');

  return (
    <>
      <JsonLd
        id="ld-org-website"
        data={{ '@context': 'https://schema.org', '@graph': [organization, website] }}
      />
      <JsonLd id="ld-faq" data={faqJsonLd} />

      {/* Primary heading for the page. The hero is image-led by design,
          so the H1 is kept off-screen but exposed to assistive tech and
          crawlers. Removing this breaks the document outline. */}
      <h1 className="sr-only">{homeCopy.h1 ?? homeCopy.title}</h1>

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
                  className={`group relative flex flex-col items-center text-center py-5 md:py-3 md:px-8 lg:px-10 ${
                    i < capabilities.length - 1 ? 'border-b md:border-b-0 md:border-e border-warm-border' : ''
                  }`}
                  data-reveal
                >
                  <div className="mb-4">
                    <Icon
                      size={32}
                      strokeWidth={1.5}
                      className="text-bronze transition-transform duration-700 ease-out group-hover:-translate-y-0.5"
                    />
                  </div>
                  <h3 className="font-display text-lg md:text-xl font-normal text-ink leading-tight mb-1.5 tracking-[-0.01em]">
                    {item.title}
                  </h3>
                  <p className="text-[14px] font-body font-normal text-ink leading-[1.55] max-w-xs">
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

      {/* Customization Workflow — OEM/ODM process */}
      <CustomizationWorkflowSection locale={locale} />

      {/* Factory & Numbers — editorial feature */}
      <FacilitySection
        locale={locale}
        images={facilityImages}
      />

      {/* FAQ — Inquiries */}
      <FaqSection backendFaqs={finalFaqs} />

      {/* Certifications */}
      <CertificationsSection images={certImages} />

      {/* Worldwide Exhibitions — hidden when no photos are uploaded */}
      <WorldwideExhibitionSection locale={locale} photos={exhibitionPhotos} />
    </>
  );
}
