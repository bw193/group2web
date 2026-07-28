export type RobotsDirective = {
  index: boolean;
  follow: boolean;
  googleBot: {
    index: boolean;
    follow: boolean;
  };
};

/**
 * Hebrew public pages are crawlable but excluded from search, except for the
 * single canonical Hebrew homepage. Other locales keep their existing policy.
 */
export function robotsForPublicPage(
  locale: string,
  options: { isCanonicalHebrewHome?: boolean } = {},
): RobotsDirective | undefined {
  if (locale !== 'he') return undefined;

  const index = options.isCanonicalHebrewHome === true;
  return {
    index,
    follow: true,
    googleBot: {
      index,
      follow: true,
    },
  };
}

/**
 * The read side of `robotsForPublicPage`: true when the locale/path pair ends
 * up indexable. Everything that advertises a URL to search engines — hreflang
 * alternates and the sitemap — must gate on this.
 *
 * A noindexed URL must never be advertised: Google discards hreflang
 * annotations that point at one, and reports the sitemap entry as "Submitted
 * URL marked 'noindex'". Keep this in lockstep with `robotsForPublicPage`;
 * `pathAfterLocale` is the generic (pre-Hebrew-rewrite) path, so the Hebrew
 * homepage is `''`, matching `buildLanguageAlternates`.
 */
export function isIndexableLocalePath(locale: string, pathAfterLocale: string): boolean {
  if (locale !== 'he') return true;
  return pathAfterLocale === '';
}
