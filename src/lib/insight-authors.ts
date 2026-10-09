// Contact emails for Insight bylines. article_translations.author is free
// text typed in the CMS, so this keys on the name as written: the lookup
// trims, collapses spaces and ignores case ("Isla Zhang " still matches).
// "Carrie" is the byline on the English anti-fog article, which is Carrie
// Liu's. Bylines without an entry (desk names such as "Studio Notes") show
// no email. Add a writer here when they start publishing.
const AUTHOR_EMAILS: Record<string, string> = {
  'carrie liu': 'bolen1@cnjxctm.com',
  carrie: 'bolen1@cnjxctm.com',
  'isla zhang': 'bolen7@cnjxctm.com',
  'betty li': 'bolen5@cnjxctm.com',
};

export function authorEmail(author: string | null | undefined): string | null {
  if (!author) return null;
  return AUTHOR_EMAILS[author.trim().replace(/\s+/g, ' ').toLowerCase()] ?? null;
}
