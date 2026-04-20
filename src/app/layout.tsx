import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chengtai Mirror - Premium LED & Bathroom Mirrors Manufacturer',
  description: 'JIAXING CHENGTAI MIRROR CO., LTD - 21 years of manufacturing excellence in LED mirrors, bathroom mirrors, and mirror cabinets.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
