export type RobotsDirective = {
  index: boolean;
  follow: boolean;
  googleBot: {
    index: boolean;
    follow: boolean;
  };
};

/**
 * Locales whose public pages are kept out of search. Empty: every public page
 * in every locale is indexable.
 *
 * Hebrew was here from 23 Jul 2026, with only its homepage indexable, until
 * 23 Nov 2026, when its pages were fully translated and opened to search.
 * Putting a locale back here noindexes its pages and takes them out of the
 * sitemaps and hreflang sets in one step.
 */
const NOINDEX_LOCALES: readonly string[] = [];

/**
 * The robots override for a locale's public pages, or undefined for none (the
 * page is indexable). Utility pages such as the contact thank-you page add
 * their own noindex on top.
 */
export function robotsForPublicPage(locale: string): RobotsDirective | undefined {
  if (!NOINDEX_LOCALES.includes(locale)) return undefined;
  return {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  };
}

/**
 * The read side of `robotsForPublicPage`: true when the locale/path pair ends
 * up indexable. Everything that advertises a URL to search engines — hreflang
 * alternates and the sitemaps — must gate on this.
 *
 * A noindexed URL must never be advertised: Google discards hreflang
 * annotations that point at one, and reports the sitemap entry as "Submitted
 * URL marked 'noindex'". Keep this in lockstep with `robotsForPublicPage`.
 * `pathAfterLocale` is the generic (pre-Hebrew-rewrite) path, so a rule for
 * one kind of page can be added here without changing the callers.
 */
export function isIndexableLocalePath(locale: string, pathAfterLocale: string): boolean {
  return !NOINDEX_LOCALES.includes(locale);
}
