import { Cormorant_Garamond, Outfit } from 'next/font/google';

export const fontDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});

export const fontBody = Outfit({
  subsets: ['latin'],
  // 700 is only used in the CMS; public site uses 300/400/500.
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});
