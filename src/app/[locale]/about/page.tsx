import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import GalleryImage from '@/components/public/GalleryImage';
import CountUp from '@/components/public/CountUp';
import WordsReveal from '@/components/public/WordsReveal';
import AboutVideoFacade from '@/components/public/about/AboutVideoFacade';
import AboutAccordion from '@/components/public/about/AboutAccordion';
import FactoryGalleryShowcase from '@/components/public/about/FactoryGalleryShowcase';
import { JsonLd } from '@/components/seo/JsonLd';
import { getAboutPagePublicData } from '@/lib/public-data';
import { getAboutVideo } from '@/lib/videos';
import { buildVideoObjectSchema, videoNodeId } from '@/lib/video-schema';
import {
  formatVideoDuration,
  getVideoPlayback,
  getYouTubeThumbnail,
  youTubeMaxResThumbnail,
} from '@/lib/video-utils';
import { getUploadUrl } from '@/lib/utils';
import {
  ADDRESS,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SITE_LEGAL_NAME,
  SITE_LOGO_URL,
  SITE_OG_IMAGE,
  SITE_URL,
  ORG_KNOWS_ABOUT,
  ORG_CERTIFICATIONS,
  SOCIAL_SAME_AS,
  buildAlternates,
  localeToOg,
  localizedSiteName,
  localizedUrl,
  pageCopy,
} from '@/lib/seo';
import { localizedPath } from '@/lib/public-paths';
import { ArrowRight, Check, PlayCircle } from 'lucide-react';

export const revalidate = 600;

/**
 * CMS figures are typed free-form and usually carry their own unit
 * ("42800㎡", "2,000,000 units"). Extract the number for the count-up and let
 * the localized unit label render exactly once beside it. Returns null when
 * there is no digit to animate, in which case the raw string is shown as-is.
 */
function statParts(raw: string): { num: number; suffix: string } | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return { num: Number.parseInt(digits, 10), suffix: raw.includes('+') ? '+' : '' };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = pageCopy(locale, 'about');
  const url = localizedUrl(locale, '/about');
  const siteName = localizedSiteName(locale);

  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(locale, '/about'),
    openGraph: {
      type: 'website',
      url,
      siteName,
      title: copy.title,
      description: copy.description,
      locale: localeToOg(locale),
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const breadcrumbT = await getTranslations('breadcrumb');
  const siteName = localizedSiteName(locale);
  const [{ about, factoryPhotos, certificationPhotos: certPhotos, faqs }, aboutVideo] = await Promise.all([
    getAboutPagePublicData(locale),
    getAboutVideo(locale),
  ]);

  const stats = [
    { raw: about?.factorySize || '50,000', unit: t('unitSqm'), label: t('facilitySize') },
    { raw: about?.employeeCount || '200+', unit: '', label: t('employees') },
    { raw: about?.annualCapacity || '2,000,000', unit: t('unitUnits'), label: t('annualCapacity') },
    { raw: '21+', unit: '', label: t('yearsExperience') },
  ];

  const factFile = [
    { label: t('factFoundedLabel'), value: t('factFoundedValue') },
    { label: t('factLogisticsLabel'), value: t('factLogisticsValue') },
    { label: t('factServicesLabel'), value: t('factServicesValue') },
    { label: t('factCatalogLabel'), value: t('factCatalogValue') },
    { label: t('factMarketsLabel'), value: t('factMarketsValue') },
    { label: t('factRdLabel'), value: t('factRdValue') },
    { label: t('factWarrantyLabel'), value: t('factWarrantyValue') },
  ];

  const filmPoints = [t('filmPoint1'), t('filmPoint2'), t('filmPoint3'), t('filmPoint4')];

  const fallbackCerts = [
    { code: 'CE', desc: t('certCE') },
    { code: 'CB', desc: t('certCB') },
    { code: 'SAA', desc: t('certSAA') },
    { code: 'ETL', desc: t('certETL') },
    { code: 'IP44', desc: t('certIP44') },
    { code: 'IP54', desc: t('certIP54') },
    { code: 'RoHS', desc: t('certRoHS') },
    { code: 'ISO 9001', desc: t('certISO') },
  ];

  // The selected factory video (CMS setting, defaulting to the factory tour).
  // A missing or unplayable video drops the section instead of rendering an
  // empty player.
  const playback = aboutVideo ? getVideoPlayback(aboutVideo) : null;
  const film =
    aboutVideo && playback && playback.kind !== 'missing'
      ? { video: aboutVideo, kind: playback.kind, src: playback.src }
      : null;
  const filmPosterBase = film
    ? film.video.thumbnailUrl
      ? getUploadUrl(film.video.thumbnailUrl)
      : getYouTubeThumbnail(film.video.videoUrl) || getYouTubeThumbnail(film.video.embedUrl)
    : '';
  const filmPoster = youTubeMaxResThumbnail(filmPosterBase) || filmPosterBase;
  const filmDuration = film ? formatVideoDuration(film.video.durationSeconds) : '';

  const aboutOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_LEGAL_NAME,
    alternateName: siteName,
    url: SITE_URL,
    logo: SITE_LOGO_URL,
    image: SITE_OG_IMAGE,
    foundingDate: '2005',
    numberOfEmployees: about?.employeeCount || '200+',
    knowsAbout: ORG_KNOWS_ABOUT,
    hasCertification: ORG_CERTIFICATIONS,
    sameAs: SOCIAL_SAME_AS,
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

  // `buildVideoObjectSchema` points url/mainEntityOfPage at the video's own
  // detail page, so About embeds the entity without becoming a second landing
  // page for it. AboutPage links to the same node by id.
  let filmLd: Record<string, unknown> | null = null;
  if (film) {
    filmLd = {
      ...buildVideoObjectSchema({ ...film.video, thumbnailUrl: filmPosterBase || null }, locale),
      '@id': videoNodeId(film.video.slug, locale),
    };
    if (!film.video.excerpt) filmLd.description = t('filmBody');
    if (film.kind === 'embed') {
      // A YouTube watch URL is not a valid contentUrl — only the embed is.
      delete filmLd.contentUrl;
      filmLd.embedUrl = film.src;
    } else {
      filmLd.contentUrl = film.src;
    }
  }

  const aboutPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    url: localizedUrl(locale, '/about'),
    mainEntity: { '@id': `${SITE_URL}/#organization` },
    ...(filmLd ? { video: { '@id': filmLd['@id'] } } : {}),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('about'), item: localizedUrl(locale, '/about') },
    ],
  };

  return (
    <>
      <JsonLd id="ld-about-org" data={aboutOrg} />
      <JsonLd id="ld-about-page" data={aboutPageJsonLd} />
      <JsonLd id="ld-about-breadcrumb" data={breadcrumb} />
      {filmLd && <JsonLd id="ld-about-video" data={filmLd} />}

      {/* Masthead — claim first, then the numbers that carry it. Text-led so the
          largest paint is a heading, not a third-party asset. */}
      <section className="relative overflow-hidden bg-cream border-b border-warm-border">
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -bottom-10 end-0 font-display text-[30vw] leading-none tracking-[-0.02em] text-ink/[0.04] lg:text-[19vw]"
        >
          2005
        </span>
        <div className="container-wide relative pt-16 pb-14 md:pt-20 md:pb-16">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="mb-5 font-body text-[13px] font-semibold uppercase tracking-[0.18em] text-bronze" data-reveal>
                {t('eyebrowSince')}
              </p>
              <WordsReveal
                as="h1"
                text={t('title')}
                italicAt={[t('title').split(/\s+/).length - 1]}
                className="font-display text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl lg:text-[62px]"
              />
            </div>
            <div className="lg:col-span-5" data-reveal>
              <p className="max-w-md font-body text-[17px] font-normal leading-[1.6] text-ink">
                {t('introSubtitle')}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
                {film && (
                  <a
                    href="#factory-film"
                    className="group inline-flex items-center gap-3 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:text-bronze"
                  >
                    <PlayCircle
                      size={19}
                      strokeWidth={1.5}
                      className="text-bronze transition-transform duration-500 ease-out-expo group-hover:scale-110"
                      aria-hidden
                    />
                    {t('watchFilm')}
                  </a>
                )}
                <Link
                  href={localizedPath(locale, '/contact')}
                  className="group inline-flex items-center gap-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-mid transition-colors duration-300 hover:text-bronze"
                >
                  {t('ctaButton')}
                  <ArrowRight
                    size={13}
                    strokeWidth={1.75}
                    className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Scale — counts up on scroll; CMS values keep their own units. */}
          <div
            className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-warm-border pt-10 md:mt-20 md:grid-cols-4 md:pt-12"
            data-reveal-stagger
          >
            {stats.map((stat) => {
              const parts = statParts(stat.raw);
              return (
                <div key={stat.label} data-reveal className="group md:border-e md:border-warm-border md:pe-8 md:last:border-e-0">
                  <p className="font-display text-[42px] font-normal leading-none tracking-[-0.02em] text-ink tabular-nums transition-colors duration-500 group-hover:text-bronze md:text-[54px]">
                    {parts ? <CountUp to={parts.num} suffix={parts.suffix} /> : stat.raw}
                  </p>
                  {stat.unit && (
                    <p className="mt-3 font-body text-[12px] font-semibold uppercase tracking-[0.16em] text-bronze">
                      {stat.unit}
                    </p>
                  )}
                  <p className="mt-3 font-body text-[15px] font-normal text-ink-mid">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Factory film — the page's single dark band, so the selected video
          reads as the centrepiece. Nothing loads from the video host until the
          visitor clicks play. */}
      {film && (
        <section
          id="factory-film"
          aria-labelledby="factory-film-heading"
          className="scroll-mt-[72px] bg-ink text-cream md:scroll-mt-20"
        >
          <div className="container-wide py-20 md:py-28">
            <div className="mb-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-16 md:mb-14">
              <div className="lg:col-span-7" data-reveal>
                <p className="mb-5 font-body text-[13px] font-semibold uppercase tracking-[0.18em] text-bronze-light">
                  {t('filmKicker')}
                </p>
                <h2
                  id="factory-film-heading"
                  className="font-display text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-cream md:text-4xl lg:text-5xl"
                >
                  {t('filmTitle')}
                </h2>
              </div>
              <div className="lg:col-span-5" data-reveal>
                <p className="max-w-md font-body text-[16px] font-normal leading-[1.65] text-cream/80 md:text-[17px]">
                  {t('filmBody')}
                </p>
              </div>
            </div>

            <div data-reveal="clip">
              <AboutVideoFacade
                kind={film.kind}
                src={film.src}
                title={film.video.title}
                poster={filmPoster}
                posterFallback={filmPosterBase !== filmPoster ? filmPosterBase : undefined}
                playLabel={t('watchFilm')}
                duration={filmDuration || undefined}
                className="shadow-[0_32px_80px_rgba(0,0,0,0.35)]"
              />
            </div>

            {/* What the walkthrough shows, plus routes deeper into the library. */}
            <div className="mt-10 grid grid-cols-1 gap-8 md:mt-12 lg:grid-cols-12 lg:gap-16">
              <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:col-span-8" data-reveal-stagger>
                {filmPoints.map((point) => (
                  <li key={point} data-reveal className="flex items-start gap-3.5">
                    <Check size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-bronze-light" aria-hidden />
                    <span className="font-body text-[15px] font-normal leading-[1.55] text-cream/90">{point}</span>
                  </li>
                ))}
              </ul>
              <div
                className="flex flex-col items-start gap-4 border-t border-cream/15 pt-6 lg:col-span-4 lg:items-end lg:border-t-0 lg:pt-0"
                data-reveal
              >
                <Link
                  href={localizedPath(locale, `/videos/${film.video.slug}`)}
                  className="group inline-flex items-center gap-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-cream transition-colors duration-300 hover:text-bronze-light"
                >
                  {t('filmOpenPage')}
                  <ArrowRight
                    size={13}
                    strokeWidth={1.75}
                    className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                  />
                </Link>
                <Link
                  href={localizedPath(locale, '/videos')}
                  className="group inline-flex items-center gap-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60 transition-colors duration-300 hover:text-bronze-light"
                >
                  {t('filmBrowseAll')}
                  <ArrowRight
                    size={13}
                    strokeWidth={1.75}
                    className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Company introduction — CMS prose beside a scannable fact file. */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide py-20 md:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-3">
              <p
                className="sticky top-32 font-body text-[13px] font-semibold uppercase tracking-[0.18em] text-bronze"
                data-reveal
              >
                {t('companyIntro')}
              </p>
            </div>
            <div className="max-w-2xl lg:col-span-6">
              {about?.content ? (
                <div
                  className="prose-content text-[17px]"
                  data-reveal
                  dangerouslySetInnerHTML={{ __html: about.content }}
                />
              ) : (
                <div data-reveal>
                  <p className="mb-6 font-display text-2xl font-normal leading-[1.3] tracking-[-0.01em] text-ink md:text-3xl">
                    {t('companyIntroFallbackLead')}
                  </p>
                  <p className="font-body text-[17px] font-normal leading-[1.65] text-ink">
                    {t('companyIntroFallbackBody')}
                  </p>
                </div>
              )}
            </div>
            <div className="lg:col-span-3" data-reveal>
              <div className="border border-warm-border bg-sand/60 p-6 md:p-7 lg:sticky lg:top-32">
                <p className="mb-5 font-body text-[12px] font-semibold uppercase tracking-[0.18em] text-bronze">
                  {t('factFileTitle')}
                </p>
                <dl>
                  {factFile.map((fact, i) => (
                    <div
                      key={fact.label}
                      className={`py-3 ${i > 0 ? 'border-t border-warm-border' : ''}`}
                    >
                      <dt className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-light">
                        {fact.label}
                      </dt>
                      <dd className="mt-1 font-body text-[14.5px] font-medium leading-[1.5] text-ink">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Factory gallery — every still opens full-screen. */}
      {factoryPhotos.length > 0 && (
        <section className="bg-sand border-b border-warm-border">
          <div className="container-wide py-20 md:py-24">
            <div className="mb-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-16" data-reveal>
              <div className="lg:col-span-7">
                <p className="mb-4 font-body text-[13px] font-semibold uppercase tracking-[0.18em] text-bronze">
                  {t('factoryGallery')}
                </p>
                <h2 className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-ink md:text-4xl">
                  {t('factoryGalleryTitle')}
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="max-w-md font-body text-[15px] font-normal leading-[1.6] text-ink-mid">
                  {t('galleryHint')}
                </p>
              </div>
            </div>
            <FactoryGalleryShowcase
              photos={factoryPhotos.map((photo) => ({
                id: photo.id,
                imageUrl: photo.imageUrl,
                caption: photo.caption,
              }))}
              altBase={`${siteName} factory in Jiaxing — production view`}
              labels={{
                open: t('galleryOpen'),
                close: t('galleryClose'),
                prev: t('galleryPrev'),
                next: t('galleryNext'),
              }}
            />
          </div>
        </section>
      )}

      {/* Certifications */}
      <section className="bg-cream border-b border-warm-border">
        <div className="container-wide py-20 md:py-24">
          <div className="mb-12 grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-16" data-reveal>
            <div className="lg:col-span-7">
              <p className="mb-4 font-body text-[13px] font-semibold uppercase tracking-[0.18em] text-bronze">
                {t('certifications')}
              </p>
              <h2 className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-ink md:text-4xl">
                {t('certificationsTitle')}
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="max-w-md font-body text-[16px] font-normal leading-[1.65] text-ink-mid md:text-[17px]">
                {t('certificationsNote')}
              </p>
            </div>
          </div>

          {certPhotos.length > 0 ? (
            <div className="grid grid-cols-2 border-s border-t border-warm-border md:grid-cols-3 lg:grid-cols-5" data-reveal-stagger>
              {certPhotos.map((cert, i) => (
                <div
                  key={cert.id}
                  className="flex aspect-square items-center justify-center border-b border-e border-warm-border bg-cream p-4 transition-colors duration-300 hover:bg-sand md:p-6"
                  data-reveal
                >
                  <GalleryImage
                    path={cert.imageUrl}
                    alt={cert.caption || `${siteName} product certification ${i + 1} (CE / CB / SAA / ETL / RoHS / ISO 9001 family)`}
                    width={420}
                    height={420}
                    sizes="(max-width: 768px) 45vw, 20vw"
                    className="h-auto max-h-full w-auto max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 border-s border-t border-warm-border md:grid-cols-4" data-reveal-stagger>
              {fallbackCerts.map((cert) => (
                <div
                  key={cert.code}
                  className="group flex aspect-square flex-col items-center justify-center gap-2 border-b border-e border-warm-border bg-cream px-4 text-center transition-colors duration-300 hover:bg-sand"
                  data-reveal
                >
                  <p className="font-display text-3xl font-normal text-ink transition-colors duration-300 group-hover:text-bronze md:text-4xl">
                    {cert.code}
                  </p>
                  <p className="font-body text-[12.5px] font-normal leading-snug text-ink-mid">{cert.desc}</p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-10 text-center font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-mid">
            CE · CB · SAA · ETL · IP44 · IP54 · RoHS · ISO 9001
          </p>
        </div>
      </section>

      {/* Q&A — the practical questions buyers ask before placing an order. */}
      {faqs.length > 0 && (
        <section className="bg-sand border-b border-warm-border">
          <div className="container-wide py-20 md:py-24">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4 lg:sticky lg:top-32">
                <p className="mb-4 font-body text-[13px] font-semibold uppercase tracking-[0.18em] text-bronze" data-reveal>
                  {t('qaKicker')}
                </p>
                <h2
                  className="font-display text-3xl font-normal leading-[1.1] tracking-[-0.015em] text-ink md:text-4xl"
                  data-reveal
                >
                  {t('qaHeading')}
                </h2>
                <p className="mt-6 max-w-md font-body text-[16px] font-normal leading-[1.65] text-ink-mid md:text-[17px]" data-reveal>
                  {t('qaBody')}
                </p>
                <Link
                  href={localizedPath(locale, '/contact')}
                  className="group mt-8 inline-flex items-center gap-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors duration-300 hover:text-bronze"
                  data-reveal
                >
                  {t('qaCta')}
                  <ArrowRight
                    size={13}
                    strokeWidth={1.75}
                    className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                  />
                </Link>
              </div>
              <div className="lg:col-span-8" data-reveal>
                <AboutAccordion items={faqs.map((faq) => ({ title: faq.q, body: faq.a }))} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="bg-cream">
        <div className="container-wide py-16 md:py-24">
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7" data-reveal>
              <h2 className="font-display text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-4xl lg:text-5xl">
                {t('ctaHeading')}
              </h2>
              <p className="mt-5 max-w-xl font-body text-[16px] font-normal leading-[1.65] text-ink-mid md:text-[17px]">
                {t('ctaBody')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 lg:col-span-5 lg:justify-end" data-reveal>
              <Link href={localizedPath(locale, '/contact')} className="btn-primary group">
                {t('ctaButton')}
                <ArrowRight
                  size={14}
                  strokeWidth={1.75}
                  className="ms-3 transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100"
                />
              </Link>
              <Link href={localizedPath(locale, '/products')} className="btn-outline">
                {t('ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
