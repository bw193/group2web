import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Keep the apex deterministic. Browser/cookie language detection made `/`
  // redirect to translated homepages such as `/he`, giving crawlers a
  // competing homepage route. The explicit `/` redirect below owns that signal.
  localeDetection: false,
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

  // The bare domain is the public homepage entry point. Always consolidate it
  // into the default English route so Google cannot pick a translated homepage
  // such as `/he` as the site's primary URL.
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url, 308);
  }

  // Anything without a locale prefix is the
  // pre-`localePrefix: 'always'` URL structure, still indexed and linked
  // externally: `/about`, `/products/<slug>`, … 308 to /en — permanent and
  // identical for every caller, so crawlers transfer signal instead of
  // parking under "Page with redirect".
  const hasLocalePrefix = locales.some(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );
  if (!hasLocalePrefix) {
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
