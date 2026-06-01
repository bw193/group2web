import { Cormorant_Garamond, Outfit, Frank_Ruhl_Libre, Heebo } from 'next/font/google';

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

// Hebrew (RTL) faces. They bind to the SAME CSS variables as the Latin fonts,
// so every existing `font-display` / `font-body` utility renders Hebrew glyphs
// with no per-component change — the locale layout swaps which pair is applied.
// `latin` subset is kept too so mixed tokens (brand, "LED", "OEM", "CE") stay
// in-family on Hebrew pages instead of falling back to a system font.
export const fontDisplayHe = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-display',
});

export const fontBodyHe = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});
