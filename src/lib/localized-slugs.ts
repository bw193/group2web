export const HEBREW_SLUG_LOCALE = 'he';
export const HEBREW_SLUG_PREFIX = 'israel-';

export function slugForLocaleFromEnglish(locale: string, englishSlug: string): string {
  const normalized = englishSlug.trim();
  if (locale === HEBREW_SLUG_LOCALE && normalized) {
    return `${HEBREW_SLUG_PREFIX}${normalized}`;
  }
  return normalized;
}
