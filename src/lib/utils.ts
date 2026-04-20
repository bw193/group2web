type ClassValue = string | number | boolean | undefined | null | Record<string, unknown> | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      classes.push(cn(...input));
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  return classes.filter(Boolean).join(' ');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const uploadBaseUrl =
  process.env.NEXT_PUBLIC_UPLOAD_URL || 'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/assets';

export function getUploadUrl(path: string | null | undefined): string {
  if (!path) return '/images/placeholder.svg';
  if (path.startsWith('http')) return path;
  const clean = path.replace(/^\//, '');
  return `${uploadBaseUrl}/${clean}`;
}

export const LOCALES = ['en', 'es', 'pt', 'fr', 'it', 'de'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
};
