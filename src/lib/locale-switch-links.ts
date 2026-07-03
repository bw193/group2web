import { locales, type Locale } from '@/i18n/config';
import { localizedPath } from '@/lib/public-paths';

export const LOCALE_SWITCH_LINKS_SCRIPT_ID = 'locale-switch-links';

export type LocaleSwitchLinksMap = Partial<Record<Locale, string>>;
export type LocaleSlug = { locale: string; slug: string };

function isLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

function buildSlugLocaleSwitchLinks(
  translations: readonly LocaleSlug[],
  routePrefix: '/products' | '/insight',
): LocaleSwitchLinksMap {
  const links: LocaleSwitchLinksMap = {};

  for (const translation of translations) {
    if (!isLocale(translation.locale)) continue;
    links[translation.locale] = localizedPath(
      translation.locale,
      `${routePrefix}/${translation.slug}`,
    );
  }

  return links;
}

export function buildProductLocaleSwitchLinks(
  translations: readonly LocaleSlug[],
): LocaleSwitchLinksMap {
  return buildSlugLocaleSwitchLinks(translations, '/products');
}

export function buildArticleLocaleSwitchLinks(
  translations: readonly LocaleSlug[],
): LocaleSwitchLinksMap {
  return buildSlugLocaleSwitchLinks(translations, '/insight');
}
