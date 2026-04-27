import type { Metadata } from 'next';
import '../globals.css';
import CMSClientLayout from './_components/cms-client-layout';
import { CmsI18nProvider } from './_lib/i18n';
import { fontDisplay, fontBody } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Chengtai CMS',
};

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>
        <CmsI18nProvider>
          <CMSClientLayout>{children}</CMSClientLayout>
        </CmsI18nProvider>
      </body>
    </html>
  );
}
