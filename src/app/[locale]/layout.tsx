import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import AnimationProvider from '@/components/public/AnimationProvider';
import { fontDisplay, fontBody } from '@/lib/fonts';

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

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body className="min-h-screen flex flex-col bg-cream relative">
        {/* Page-wide film grain — fixed, non-interactive */}
        <div className="atmosphere-grain" aria-hidden />
        <NextIntlClientProvider messages={messages}>
          <AnimationProvider />
          <Header />
          <main className="flex-1 relative z-[2] pt-[72px] md:pt-20">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
