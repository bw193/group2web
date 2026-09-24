import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CE/UL Certified LED & Bathroom Mirror Factory | Chengtai Mirror',
    template: '%s',
  },
  description:
    'Chengtai Mirror — specialized factory for premium LED bathroom mirrors, mirror cabinets & full-length mirrors. CE, ETL & RoHS certified for global retail.',
  applicationName: 'Chengtai Mirror',
  authors: [{ name: 'Jiaxing Chengtai Mirror Co., Ltd' }],
  formatDetection: { telephone: false },
  // Icons come from the file conventions beside this layout — favicon.ico,
  // icon.png, apple-icon.png — served from the site's own domain. The
  // Supabase-hosted SITE_LOGO_URL stays the logo in structured data only:
  // it is the wide lockup, and search engines ignore non-square favicons.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
