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
