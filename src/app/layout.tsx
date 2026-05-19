import type { Metadata } from 'next';
import { SITE_LOGO_URL, SITE_URL } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Chengtai Mirror — LED, Smart & Bathroom Mirror Manufacturer',
    template: '%s',
  },
  description:
    'Jiaxing Chengtai Mirror Co., Ltd — 21 years of manufacturing excellence in LED mirrors, bathroom mirrors, and mirror cabinets.',
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
