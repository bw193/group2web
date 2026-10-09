import { Bodoni_Moda, Cormorant_Garamond, Outfit, Frank_Ruhl_Libre, Heebo } from 'next/font/google';

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

// Footer slogan only (the homepage H1, Footer.tsx). Upright Bodoni Moda with
// its optical-size axis, so the 24–30px line gets display contrast (thin
// hairlines), as in the approved preview. `preload: false`: it sits far below
// the fold and shouldn't compete with the LCP image; the @font-face rule still
// ships, so the footer loads it when it renders. Latin pages only.
export const fontAccent = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal'],
  axes: ['opsz'],
  display: 'swap',
  preload: false,
  variable: '--font-accent',
});

// Hebrew (RTL) faces. They bind to the SAME CSS variables as the Latin fonts,
// so every existing `font-display` / `font-body` utility renders Hebrew glyphs
// with no per-component change — the locale layout swaps which pair is applied.
// `latin` subset is kept too so mixed tokens (brand, "LED", "OEM", "CE") stay
// in-family on Hebrew pages instead of falling back to a system font.
//
// `preload: false` because the locale layout imports all four faces, so Next
// emitted preload links for these two on Latin pages as well: 105 KB of Hebrew
// fonts fetched at the highest priority on pages that never render a Hebrew
// glyph, competing with the LCP image (F-06 in the 2026-09-15 SEO audit). The
// @font-face rules still ship in the same stylesheet, so Hebrew pages load
// them exactly as before, just discovered from the CSS rather than a hint.
export const fontDisplayHe = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  preload: false,
  variable: '--font-display',
});

export const fontBodyHe = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-body',
});
