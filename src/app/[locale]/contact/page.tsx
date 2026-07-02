import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import InquiryForm from '@/components/public/InquiryForm';
import TrackedContactLink, { type DirectContactMethod } from '@/components/public/TrackedContactLink';
import { Mail, MessageCircle, MapPin } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { getContactCategories } from '@/lib/public-data';
import {
  ADDRESS,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SITE_OG_IMAGE,
  SITE_URL,
  buildAlternates,
  localeToOg,
  localizedSiteName,
  localizedUrl,
  pageCopy,
} from '@/lib/seo';

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = pageCopy(locale, 'contact');
  const url = localizedUrl(locale, '/contact');
  const siteName = localizedSiteName(locale);

  return {
    title: copy.title,
    description: copy.description,
    alternates: buildAlternates(locale, '/contact'),
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

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const breadcrumbT = await getTranslations('breadcrumb');
  const siteName = localizedSiteName(locale);
  const categories = await getContactCategories(locale);

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: localizedUrl(locale, '/contact'),
    name: pageCopy(locale, 'contact').title,
    about: { '@id': `${SITE_URL}/#organization` },
    mainEntity: {
      '@type': 'Organization',
      name: siteName,
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE,
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
    },
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: breadcrumbT('home'), item: localizedUrl(locale, '') },
      { '@type': 'ListItem', position: 2, name: breadcrumbT('contact'), item: localizedUrl(locale, '/contact') },
    ],
  };

  return (
    <section className="bg-cream">
      <JsonLd id="ld-contact" data={contactJsonLd} />
      <JsonLd id="ld-contact-breadcrumb" data={breadcrumb} />
      <div className="container-narrow pt-16 pb-24 md:pt-20 md:pb-32">
        {/* Header - one line, readable, no decorative chrome */}
        <header className="mb-14 md:mb-16">
          <p className="text-[13px] font-body font-medium text-bronze uppercase tracking-[0.18em] mb-5">
            {t('eyebrow')}
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[56px] font-normal text-ink tracking-[-0.02em] leading-[1.05]">
            {t('formTitle')}
          </h1>
          <p className="mt-5 text-[17px] md:text-[18px] font-body font-normal text-ink leading-[1.6] max-w-2xl">
            {t('pageIntro')}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Form */}
          <div className="lg:col-span-8">
            <InquiryForm categories={categories} />
          </div>

          {/* Direct contact - simple, readable, no vertical rule or quote */}
          <aside className="lg:col-span-4">
            <div className="bg-sand p-6 md:p-7">
              <h2 className="font-display text-[24px] font-normal text-ink mb-6">
                {t('directLine')}
              </h2>

              <ul className="space-y-5">
                <ContactRow
                  icon={<Mail size={18} strokeWidth={1.75} />}
                  label={t('emailLabel')}
                  value="bolen5@cnjxctm.com"
                  href="mailto:bolen5@cnjxctm.com"
                  trackingMethod="email"
                  trackingLocation="contact_sidebar"
                />
                <ContactRow
                  icon={<MessageCircle size={18} strokeWidth={1.75} />}
                  label={t('whatsappLabel')}
                  value="+86 178 6056 7239"
                  href="https://wa.me/8617860567239"
                  trackingMethod="whatsapp"
                  trackingLocation="contact_sidebar"
                  external
                />
                <ContactRow
                  icon={<MapPin size={18} strokeWidth={1.75} />}
                  label={t('addressLabel')}
                  value={
                    <>
                      No. 768 Xinda Road,<br />
                      Xinfeng Town, Nanhu District,<br />
                      Jiaxing, Zhejiang, China
                    </>
                  }
                />
              </ul>

              <p className="mt-7 pt-5 border-t border-warm-border text-[14px] font-body text-ink">
                <span className="font-medium">{t('hoursLabel')}</span>{' '}
                <span className="text-ink-mid">{t('hoursValue')}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ----- Direct-contact row: icon + label + value, all readable ----- */
function ContactRow({
  icon,
  label,
  value,
  href,
  external,
  trackingMethod,
  trackingLocation,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  href?: string;
  external?: boolean;
  trackingMethod?: DirectContactMethod;
  trackingLocation?: string;
}) {
  const content = (
    <>
      <span className="shrink-0 mt-0.5 text-bronze">{icon}</span>
      <div>
        <p className="text-[12px] font-body font-medium text-ink-mid uppercase tracking-[0.1em] mb-1">
          {label}
        </p>
        <p className="text-[15px] font-body text-ink leading-[1.55]">{value}</p>
      </div>
    </>
  );

  if (href) {
    const linkClassName = 'flex items-start gap-3 hover:text-bronze transition-colors';

    return (
      <li>
        {trackingMethod ? (
          <TrackedContactLink
            href={href}
            method={trackingMethod}
            location={trackingLocation || 'contact'}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className={linkClassName}
          >
            {content}
          </TrackedContactLink>
        ) : (
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className={linkClassName}
          >
            {content}
          </a>
        )}
      </li>
    );
  }
  return <li className="flex items-start gap-3">{content}</li>;
}
