import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from '@/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Root `/` is handled below so English/default requests can stay on the
  // apex URL. next-intl still handles prefixed locale routes normally.
  localeDetection: true,
  // alternateLinks stays OFF: the auto Link header advertised an
  // unprefixed x-default plus same-slug alternates for every locale.
  // Product/article slugs are localized, so most of those URLs redirect —
  // that header fed Google the bulk of the "Page with redirect" pile-up.
  // Correct per-locale-slug hreflang already ships in the page metadata
  // and the sitemap.
  alternateLinks: false,
});

// Root language auto-jump is preference-based only: NEXT_LOCALE wins, then
// Accept-Language. English/no preference stays at `/`.
function isSupportedLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

function isNonDefaultLocale(value: string | undefined): value is Locale {
  return isSupportedLocale(value) && value !== defaultLocale;
}

function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;

  const preferred = header
    .split(',')
    .map((part, index) => {
      const [rawTag, ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;

      return {
        tag: rawTag.toLowerCase(),
        q: Number.isFinite(q) ? q : 0,
        index,
      };
    })
    .filter((entry) => entry.tag && entry.tag !== '*' && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const entry of preferred) {
    const base = entry.tag.split('-')[0];
    const match = locales.find((loc) => loc === entry.tag || loc === base);
    if (match) return match;
  }

  return null;
}

function preferredNonEnglishLocale(request: NextRequest): Locale | null {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (isNonDefaultLocale(cookieLocale)) return cookieLocale;
  if (cookieLocale === defaultLocale) return null;

  const acceptedLocale = parseAcceptLanguage(request.headers.get('accept-language'));
  return acceptedLocale && acceptedLocale !== defaultLocale ? acceptedLocale : null;
}

function appendVary(response: NextResponse, value: string): NextResponse {
  const existing = response.headers.get('Vary');
  if (!existing) {
    response.headers.set('Vary', value);
    return response;
  }

  const existingValues = existing.split(',').map((item) => item.trim().toLowerCase());
  const nextValues = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && !existingValues.includes(item.toLowerCase()));

  if (nextValues.length) {
    response.headers.set('Vary', `${existing}, ${nextValues.join(', ')}`);
  }
  return response;
}

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

  // Apex `/`: explicit non-English preference still gets a temporary jump to
  // that locale. English, no preference, and crawler-like requests are served
  // the English homepage at `/` by rewriting internally to the default locale.
  if (pathname === '/') {
    const preferredLocale = preferredNonEnglishLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = preferredLocale ? `/${preferredLocale}` : `/${defaultLocale}`;
    const response = preferredLocale ? NextResponse.redirect(url, 307) : NextResponse.rewrite(url);
    return appendVary(response, 'Accept-Language, Cookie');
  }

  // Anything without a locale prefix (except `/`, handled above) is the
  // pre-`localePrefix: 'always'` URL structure, still indexed and linked
  // externally: `/about`, `/products/<slug>`, … 308 to /en — permanent and
  // identical for every caller, so crawlers transfer signal instead of
  // parking under "Page with redirect".
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
