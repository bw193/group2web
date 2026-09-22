import { locales, type Locale } from '@/i18n/config';

export const HEBREW_PUBLIC_PATHS = {
  home: '/israel-home',
  about: '/israel-about',
  contact: '/israel-contact',
  contactThankYou: '/israel-contact/israel-thank-you',
  products: '/israel-products',
  insight: '/israel-insight',
} as const;

const HEBREW_SEGMENT_PREFIX = 'israel-';

/**
 * Insight lives at /insight/<category>/<article-slug>, so each article sits
 * under the category it belongs to and every category has a landing page of
 * its own at /insight/<category>.
 *
 * Both builders return the GENERIC path (before the Hebrew rewrite): pass the
 * result to localizedPath / localizedUrl / isIndexableLocalePath, each of
 * which already knows how to turn it into its Hebrew form.
 */
export function insightCategoryPathAfterLocale(categoryKey: string): string {
  return `/insight/${categoryKey}`;
}

export function insightArticlePathAfterLocale(categoryKey: string, slug: string): string {
  return `/insight/${categoryKey}/${slug}`;
}

/**
 * Hebrew URLs prefix every section segment (`/israel-insight`), and the
 * category key is a section, so it carries the prefix too:
 * `/he/israel-insight/israel-sourcing/israel-<slug>`. Article slugs are
 * already stored prefixed in `article_translations`, so only the category
 * segment is rewritten here.
 */
export function hebrewCategorySegment(categoryKey: string): string {
  return categoryKey.startsWith(HEBREW_SEGMENT_PREFIX)
    ? categoryKey
    : `${HEBREW_SEGMENT_PREFIX}${categoryKey}`;
}

/** The read side of `hebrewCategorySegment`, for resolving a route param. */
export function categoryKeyFromSegment(locale: string, segment: string): string {
  if (locale !== 'he') return segment;
  return segment.startsWith(HEBREW_SEGMENT_PREFIX)
    ? segment.slice(HEBREW_SEGMENT_PREFIX.length)
    : segment;
}

function mapFirstSegment(rest: string, map: (segment: string) => string): string {
  if (!rest) return rest;
  const [, first, tail] = rest.match(/^\/([^/]*)(.*)$/) ?? [];
  if (first === undefined) return rest;
  return `/${map(first)}${tail ?? ''}`;
}

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
    const rest = mapFirstSegment(path.slice('/insight'.length), hebrewCategorySegment);
    return `${HEBREW_PUBLIC_PATHS.insight}${rest}${suffix}`;
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
    const rest = mapFirstSegment(path.slice(HEBREW_PUBLIC_PATHS.insight.length), (segment) =>
      categoryKeyFromSegment('he', segment),
    );
    return `/insight${rest}${suffix}`;
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
