import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chengtaimirror.com'),
  title: 'Chengtai Mirror - Premium LED & Bathroom Mirrors Manufacturer',
  description: 'JIAXING CHENGTAI MIRROR CO., LTD - 21 years of manufacturing excellence in LED mirrors, bathroom mirrors, and mirror cabinets.',
  icons: {
    icon: 'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/assets/Favicon.png',
    shortcut: 'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/assets/Favicon.png',
    apple: 'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/assets/Favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
