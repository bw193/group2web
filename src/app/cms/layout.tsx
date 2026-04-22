import type { Metadata } from 'next';
import '../globals.css';
import CMSClientLayout from './_components/cms-client-layout';
import { fontDisplay, fontBody } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Chengtai CMS',
};

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>
        <CMSClientLayout>{children}</CMSClientLayout>
      </body>
    </html>
  );
}
