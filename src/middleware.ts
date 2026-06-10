import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // localeDetection stays ON, but it only ever applies to `/`: every other
  // unprefixed path is 308'd to /en below before next-intl sees it. First
  // visit to the bare domain routes by browser language, return visits by
  // the NEXT_LOCALE cookie. Googlebot sends no cookie and crawls with
  // en/no Accept-Language, so it consistently gets /en; metadata + sitemap
  // declare /en as x-default, which contains the varying 307 on `/`.
  localeDetection: true,
  // alternateLinks stays OFF: the auto Link header advertised an
  // unprefixed x-default plus same-slug alternates for every locale.
  // Product/article slugs are localized, so most of those URLs redirect —
  // that header fed Google the bulk of the "Page with redirect" pile-up.
  // Correct per-locale-slug hreflang already ships in the page metadata
  // and the sitemap.
  alternateLinks: false,
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Anything without a locale prefix (except `/`, which falls through to
  // next-intl's language detection below) is the pre-`localePrefix:
  // 'always'` URL structure, still indexed and linked externally:
  // `/about`, `/products/<slug>`, … 308 it to the /en equivalent —
  // permanent and identical for every caller, so crawlers can transfer
  // signal instead of parking the URL under "Page with redirect".
  const hasLocalePrefix = locales.some(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );
  if (!hasLocalePrefix && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Skip _next, api, cms, uploads, images, favicon, sitemap, robots,
    // and any path that contains a "." (static asset). CMS/API early-exit
    // in the middleware function itself is the runtime safety net — the
    // matcher just filters out the obvious static assets.
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|uploads|images|.*\\..*).*)',
  ],
};
