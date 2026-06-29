import { locales, type Locale } from '@/i18n/config';

export const HEBREW_PUBLIC_PATHS = {
  home: '/israel-home',
  about: '/israel-about',
  contact: '/israel-contact',
  contactThankYou: '/israel-contact/israel-thank-you',
  products: '/israel-products',
  insight: '/israel-insight',
} as const;

function splitPathSuffix(path: string): { path: string; suffix: string } {
  const match = path.match(/^([^?#]*)(.*)$/);
  return {
    path: match?.[1] ?? '',
    suffix: match?.[2] ?? '',
  };
}

function normalizePathAfterLocale(pathAfterLocale: string): string {
  if (!pathAfterLocale || pathAfterLocale === '/') return '';
  return pathAfterLocale.startsWith('/') ? pathAfterLocale : `/${pathAfterLocale}`;
}

export function canonicalPathAfterLocale(locale: string, pathAfterLocale: string): string {
  const normalized = normalizePathAfterLocale(pathAfterLocale);
  if (locale !== 'he') return normalized;

  const { path, suffix } = splitPathSuffix(normalized);
  if (path === '') return `${HEBREW_PUBLIC_PATHS.home}${suffix}`;
  if (path === '/about') return `${HEBREW_PUBLIC_PATHS.about}${suffix}`;
  if (path === '/contact') return `${HEBREW_PUBLIC_PATHS.contact}${suffix}`;
  if (path === '/contact/thank-you') return `${HEBREW_PUBLIC_PATHS.contactThankYou}${suffix}`;
  if (path === '/products' || path.startsWith('/products/')) {
    return `${HEBREW_PUBLIC_PATHS.products}${path.slice('/products'.length)}${suffix}`;
  }
  if (path === '/insight' || path.startsWith('/insight/')) {
    return `${HEBREW_PUBLIC_PATHS.insight}${path.slice('/insight'.length)}${suffix}`;
  }
  return normalized;
}

export function genericPathAfterLocale(locale: string, pathAfterLocale: string): string {
  const normalized = normalizePathAfterLocale(pathAfterLocale);
  if (locale !== 'he') return normalized;

  const { path, suffix } = splitPathSuffix(normalized);
  if (path === HEBREW_PUBLIC_PATHS.home) return suffix ? `/${suffix}` : '';
  if (path === HEBREW_PUBLIC_PATHS.about) return `/about${suffix}`;
  if (path === HEBREW_PUBLIC_PATHS.contact) return `/contact${suffix}`;
  if (path === HEBREW_PUBLIC_PATHS.contactThankYou) return `/contact/thank-you${suffix}`;
  if (path === HEBREW_PUBLIC_PATHS.products || path.startsWith(`${HEBREW_PUBLIC_PATHS.products}/`)) {
    return `/products${path.slice(HEBREW_PUBLIC_PATHS.products.length)}${suffix}`;
  }
  if (path === HEBREW_PUBLIC_PATHS.insight || path.startsWith(`${HEBREW_PUBLIC_PATHS.insight}/`)) {
    return `/insight${path.slice(HEBREW_PUBLIC_PATHS.insight.length)}${suffix}`;
  }
  return normalized;
}

export function localizedPath(locale: string, pathAfterLocale: string): string {
  return `/${locale}${canonicalPathAfterLocale(locale, pathAfterLocale)}`;
}

export function localizedPathFromPathname(pathname: string, targetLocale: Locale): string {
  const segments = pathname.split('/');
  const currentLocale = (locales as readonly string[]).includes(segments[1]) ? segments[1] : null;
  const pathAfterLocale = currentLocale ? `/${segments.slice(2).join('/')}` : pathname;
  const generic = genericPathAfterLocale(currentLocale ?? targetLocale, pathAfterLocale);
  return localizedPath(targetLocale, generic);
}
