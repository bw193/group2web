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
 * Insight is two levels deep: every category has a landing page at
 * /insight/<category>, and every article sits under the category it belongs
 * to at /insight/<category>/<slug>.
 *
 * Both return the GENERIC path, before the Hebrew rewrite. Hand the result to
 * localizedPath / localizedUrl / isIndexableLocalePath, which already know how
 * to turn it into the Hebrew form.
 */
export function insightCategoryPathAfterLocale(categoryKey: string): string {
  return `/insight/${categoryKey}`;
}

export function insightArticlePathAfterLocale(categoryKey: string, slug: string): string {
  return `/insight/${categoryKey}/${slug}`;
}

/**
 * Hebrew prefixes every public segment with israel- (see
 * israel-url-style-change.zh-CN.md: even /he/israel-contact/israel-thank-you),
 * so the category segment carries it too:
 * /he/israel-insight/israel-sourcing/israel-<slug>. Article slugs are stored
 * already prefixed in article_translations, so they pass through untouched;
 * only the category segment is rewritten here, in both directions.
 */
function hebrewCategorySegment(categoryKey: string): string {
  return categoryKey.startsWith(HEBREW_SEGMENT_PREFIX)
    ? categoryKey
    : `${HEBREW_SEGMENT_PREFIX}${categoryKey}`;
}

/**
 * The one URL segment a category key has in `locale`. Routes compare the
 * incoming segment against it and redirect when they differ, so
 * /he/israel-insight/sourcing never renders as a twin of .../israel-sourcing.
 */
export function insightCategorySegment(locale: string, categoryKey: string): string {
  return locale === 'he' ? hebrewCategorySegment(categoryKey) : categoryKey;
}

/** The category key a route's `[category]` segment names, in any locale. */
export function categoryKeyFromSegment(locale: string, segment: string): string {
  if (locale !== 'he' || !segment.startsWith(HEBREW_SEGMENT_PREFIX)) return segment;
  return segment.slice(HEBREW_SEGMENT_PREFIX.length);
}

/** Apply `map` to the first segment of `/a/b/c`, leaving the rest as is. */
function mapFirstSegment(rest: string, map: (segment: string) => string): string {
  const match = rest.match(/^\/([^/]+)(.*)$/);
  return match ? `/${map(match[1])}${match[2]}` : rest;
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
