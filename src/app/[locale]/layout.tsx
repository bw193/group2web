import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { locales } from '@/i18n/config';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import AnimationProvider from '@/components/public/AnimationProvider';
import NavProgress from '@/components/public/NavProgress';
import { fontDisplay, fontBody } from '@/lib/fonts';

// Run server rendering / ISR regeneration in Dublin (dub1) to colocate with
// the Supabase database (eu-west-1) and avoid a transatlantic hop per query.
export const preferredRegion = 'dub1';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Opt into static rendering. Without this, next-intl falls back to reading
  // headers() to resolve the locale, which forces every page into per-request
  // dynamic rendering and silently disables ISR despite `revalidate`.
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body className="min-h-screen flex flex-col bg-cream relative">
        {/* Page-wide film grain — fixed, non-interactive */}
        <div className="atmosphere-grain" aria-hidden />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AnimationProvider />
          <NavProgress />
          <Header />
          <main className="flex-1 relative z-[2] pt-[72px] md:pt-20">{children}</main>
          <Footer />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics gaId="G-C201XKXR1X" />
      </body>
    </html>
  );
}
