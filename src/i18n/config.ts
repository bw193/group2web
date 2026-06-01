export const locales = ['en', 'es', 'pt', 'fr', 'it', 'de', 'he'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
  he: 'עברית',
};

/** Locales that render right-to-left. */
export const rtlLocales: readonly Locale[] = ['he'];

export function isRtlLocale(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}
