// Helpers for company-gallery images that are pre-optimized at upload time
// (see src/app/api/upload/route.ts) and served directly from Supabase's CDN,
// bypassing Vercel's image optimizer (no per-image transform cost).
//
// Optimized keys carry a width marker, e.g. `facility/floor-3f9k2a-opt@1600.webp`.
// The `-opt@<width>` token is what distinguishes them from legacy images, which
// keep going through next/image (`/_next/image`) exactly as before.

export const OPTIMIZED_WIDTHS = [384, 768, 1080, 1600] as const;

const OPT_MATCH = /-opt@\d+\.webp(?:$|\?)/i;
const OPT_SWAP = /-opt@\d+\.webp/i;

/** True for keys/URLs produced by the multi-size (gallery) upload path. */
export function isOptimizedKey(key: string | null | undefined): boolean {
  return !!key && OPT_MATCH.test(key);
}

/** Rewrite an optimized URL/key to a specific pre-generated width variant. */
function variant(urlOrKey: string, width: number): string {
  return urlOrKey.replace(OPT_SWAP, `-opt@${width}.webp`);
}

/** A sensible mid-size default for the plain `src` attribute. */
export function optimizedSrc(url: string): string {
  return variant(url, 768);
}

/** A `srcSet` spanning the pre-generated widths so the browser picks per device. */
export function optimizedSrcSet(url: string): string {
  return OPTIMIZED_WIDTHS.map((w) => `${variant(url, w)} ${w}w`).join(', ');
}
