import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// Unprefixed product detail URLs (e.g. `/products/foo-mirror`) were live
// before the `localePrefix: 'always'` switch and may still be indexed.
// Next.js `redirects()` can't pattern-match dynamic segments, so catch
// them here and 308 to the /en/... equivalent. The bare `/products`
// listing is handled by the static redirect list in next.config.ts.
const LEGACY_PRODUCT_SLUG_RE = /^\/products\/[^/]+\/?$/;

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (LEGACY_PRODUCT_SLUG_RE.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  // Skip middleware for CMS, API, and static files
  if (
    pathname.startsWith('/cms') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Skip _next, api, cms, uploads, images, favicon, sitemap, robots,
    // and any path that contains a "." (static asset)
    '/((?!api|cms|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|uploads|images|.*\\..*).*)',
  ],
};
