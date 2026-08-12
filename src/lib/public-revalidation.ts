import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { localizedPath } from '@/lib/public-paths';

type RevalidationOptions = {
  includeLegacyHebrewPath?: boolean;
};

function genericLocalizedPath(locale: string, pathAfterLocale: string): string {
  if (!pathAfterLocale || pathAfterLocale === '/') return `/${locale}`;
  return `/${locale}${pathAfterLocale.startsWith('/') ? pathAfterLocale : `/${pathAfterLocale}`}`;
}

/**
 * Resolve the public URLs that need invalidating for a localized route.
 *
 * Hebrew detail mutations also refresh the legacy generic URL because those
 * routes may hold a cached redirect or an old slug. Index and home mutations
 * should use the canonical URL only.
 */
export function localizedRevalidationPaths(
  locale: string,
  pathAfterLocale: string,
  options: RevalidationOptions = {},
): string[] {
  const canonical = localizedPath(locale, pathAfterLocale);
  if (!options.includeLegacyHebrewPath || locale !== 'he') return [canonical];

  const legacy = genericLocalizedPath(locale, pathAfterLocale);
  return legacy === canonical ? [canonical] : [canonical, legacy];
}

export function revalidateLocalizedPublicPath(
  locale: string,
  pathAfterLocale: string,
  options?: RevalidationOptions,
): void {
  for (const path of localizedRevalidationPaths(locale, pathAfterLocale, options)) {
    revalidatePath(path);
  }
}

export function revalidateLocalizedDetailPath(
  locale: string,
  section: 'products' | 'insight',
  slug: string,
): void {
  revalidateLocalizedPublicPath(locale, `/${section}/${slug}`, {
    includeLegacyHebrewPath: true,
  });
}

export function revalidateAllLocalizedPublicPaths(pathAfterLocale: string): void {
  for (const locale of locales) {
    revalidateLocalizedPublicPath(locale, pathAfterLocale);
  }
}

export function revalidatePublicSitemap(): void {
  revalidatePath('/sitemap.xml');
}
