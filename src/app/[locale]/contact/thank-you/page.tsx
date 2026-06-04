import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Check, ArrowRight } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo';

// Post-submission confirmation. Its whole job is to be a stable URL the user
// reaches after the contact form succeeds — the Google Ads "Submit lead form"
// conversion destination. noindex (utility page), no DB query, no images.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: `${t('successHeading')} | ${SITE_NAME}`,
    description: t('success'),
    robots: { index: false, follow: true },
  };
}

export default async function ContactThankYouPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const tNav = await getTranslations('nav');

  return (
    <section className="bg-cream">
      <div className="container-narrow pt-16 pb-24 md:pt-24 md:pb-36 min-h-[62vh] flex items-center">
        <div className="max-w-2xl" data-reveal-stagger>
          <div
            className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-bronze/40 text-bronze mb-8"
            data-reveal
          >
            <Check size={20} strokeWidth={2} />
          </div>

          <p
            className="text-[13px] font-body font-medium text-bronze uppercase tracking-[0.18em] mb-5"
            data-reveal
          >
            {t('successLabel')}
          </p>
          <h1
            className="font-display text-4xl md:text-5xl lg:text-[56px] font-normal text-ink tracking-[-0.02em] leading-[1.05]"
            data-reveal
          >
            {t('successHeading')}
          </h1>
          <p
            className="mt-6 text-[17px] md:text-[18px] font-body text-ink-mid leading-[1.6] max-w-lg"
            data-reveal
          >
            {t('success')}
          </p>

          <div
            className="mt-10 pt-10 border-t border-warm-border flex flex-wrap items-center gap-x-8 gap-y-4"
            data-reveal
          >
            <Link href={`/${locale}/products`} className="btn-primary group">
              {tNav('products')}
              <ArrowRight
                size={14}
                strokeWidth={1.75}
                className="ms-3 transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100"
              />
            </Link>
            <Link href={`/${locale}`} className="btn-ghost">
              {tNav('home')}
            </Link>
          </div>

          <p className="mt-10 text-[14px] font-body text-ink-mid" data-reveal>
            {t('directLine')}:{' '}
            <a
              href="mailto:bolen5@cnjxctm.com"
              className="text-ink underline decoration-bronze/40 underline-offset-4 hover:text-bronze transition-colors"
            >
              bolen5@cnjxctm.com
            </a>
            <span className="mx-2 text-ink-light" aria-hidden>·</span>
            <a
              href="https://wa.me/8617860567239"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline decoration-bronze/40 underline-offset-4 hover:text-bronze transition-colors"
            >
              WhatsApp
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
