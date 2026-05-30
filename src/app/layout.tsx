import type { Metadata } from 'next';
import { SITE_LOGO_URL, SITE_URL } from '@/lib/seo';
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
  icons: {
    icon: SITE_LOGO_URL,
    shortcut: SITE_LOGO_URL,
    apple: SITE_LOGO_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
