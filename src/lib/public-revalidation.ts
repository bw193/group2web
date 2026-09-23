import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import {
  insightArticlePathAfterLocale,
  insightCategoryPathAfterLocale,
  localizedPath,
} from '@/lib/public-paths';

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
  section: 'products' | 'videos',
  slug: string,
): void {
  revalidateLocalizedPublicPath(locale, `/${section}/${slug}`, {
    includeLegacyHebrewPath: true,
  });
}

/**
 * Insight articles are the one nested detail route —
 * /insight/<category>/<slug> — so busting one takes the category too. Kept
 * separate from revalidateLocalizedDetailPath so a caller cannot bust the
 * flat /insight/<slug> form, which only redirects now.
 */
export function revalidateInsightArticlePath(
  locale: string,
  categoryKey: string,
  slug: string,
): void {
  revalidateLocalizedPublicPath(locale, insightArticlePathAfterLocale(categoryKey, slug), {
    includeLegacyHebrewPath: true,
  });
}

/**
 * Category landing pages list their stories, so any article mutation busts the
 * categories involved — both sides of a move — in every locale.
 */
export function revalidateInsightCategoryPaths(...categoryKeys: string[]): void {
  for (const key of new Set(categoryKeys.filter(Boolean))) {
    for (const locale of locales) {
      revalidateLocalizedPublicPath(locale, insightCategoryPathAfterLocale(key), {
        includeLegacyHebrewPath: true,
      });
    }
  }
}

/**
 * Invalidate a whole dynamic detail route across locales, for content that is
 * embedded in every page of that route rather than owned by one slug. Goes
 * through `localizedPath` so the Hebrew mirror segment is covered too.
 */
export function revalidateLocalizedDetailRoute(
  section: 'products' | 'insight' | 'videos',
): void {
  const pattern = section === 'insight' ? '/[category]/[slug]' : '/[slug]';
  for (const locale of locales) {
    revalidatePath(`${localizedPath(locale, `/${section}`)}${pattern}`, 'page');
  }
}

export function revalidateAllLocalizedPublicPaths(pathAfterLocale: string): void {
  for (const locale of locales) {
    revalidateLocalizedPublicPath(locale, pathAfterLocale);
  }
}

export function revalidatePublicSitemap(): void {
  revalidatePath('/sitemap.xml');
}
