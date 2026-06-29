import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HeroBanner from '@/components/public/HeroBanner';
import FeaturedProductsSection from '@/components/public/FeaturedProductsSection';
import CustomizationWorkflowSection from '@/components/public/CustomizationWorkflowSection';
import FacilitySection from '@/components/public/FacilitySection';
import CertificationsSection from '@/components/public/CertificationsSection';
import WorldwideExhibitionSection from '@/components/public/WorldwideExhibitionSection';
import FaqSection from '@/components/public/FaqSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { getHomePagePublicData } from '@/lib/public-data';
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
import { localizedPath } from '@/lib/public-paths';
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
  { q: 'Do you accept sample orders?', a: 'Yes - we support our customers in ordering samples to test quality and function before placing a full production order.' },
  { q: 'What is your typical lead time?', a: 'Generally 10-15 days for standard orders. Larger volumes are scheduled with you in advance.' },
  { q: 'Do you have an MOQ restriction?', a: 'Low MOQ - even a single piece is acceptable for sample checking.' },
  { q: 'Do you operate your own factory?', a: 'Yes. Fifteen years specializing in mirror manufacturing - LED, bathroom, dressing, and full mirror cabinets, all in-house.' },
  { q: 'Can we print our own logo on the products?', a: 'Yes. Confirm the design against our pre-production sample and let us know before production begins.' },
  { q: 'Do you offer a warranty on the products?', a: 'Every product ships with a two-year warranty.' },
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const {
    bannerSlides,
    featuredProducts: featuredWithDetails,
    categories: categoryOptions,
    facilityPhotos: facilityPhoto,
    certificationPhotos: certPhotos,
    exhibitionPhotos,
    faqs: finalFaqs,
  } = await getHomePagePublicData(locale);

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
        fallbackHref={localizedPath(locale, '/contact')}
      />

      {/* Capabilities - compact four-column plinth seamed into the hero */}
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

      {/* Customization Workflow - OEM/ODM process */}
      <CustomizationWorkflowSection locale={locale} />

      {/* Factory & Numbers - editorial feature */}
      <FacilitySection
        locale={locale}
        images={facilityPhoto.map((p) => p.imageUrl)}
      />

      {/* FAQ - Inquiries */}
      <FaqSection backendFaqs={finalFaqs} />

      {/* Certifications */}
      <CertificationsSection images={certPhotos.map((p) => p.imageUrl)} />

      {/* Worldwide Exhibitions - hidden when no photos are uploaded */}
      <WorldwideExhibitionSection locale={locale} photos={exhibitionPhotos} />
    </>
  );
}
