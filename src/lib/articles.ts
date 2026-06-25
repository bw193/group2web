import { and, eq, inArray, ne, type SQL } from 'drizzle-orm';
import { articleTranslations } from './db/schema';
import { slugify } from './utils';

export const ARTICLE_SLUG_SOURCE_LOCALE = 'en';

export function articleSlugFromInput(input: {
  slug?: string | null;
  title?: string | null;
}): string {
  return slugify(input.slug?.trim() || input.title?.trim() || '');
}

export function resolveArticleTranslationSlug(args: {
  locale: string;
  englishSlug: string;
}): string {
  return args.englishSlug;
}

export async function disambiguateSharedArticleSlug(
  // Accepts either the top-level db or a transaction handle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  args: {
    locales: readonly string[];
    slug: string;
    articleId: number;
    excludeArticleId?: number;
  },
): Promise<string> {
  const locales = Array.from(new Set(args.locales.filter(Boolean)));
  if (locales.length === 0) {
    throw new Error('cannot disambiguate article slug without target locales');
  }

  const candidates = [args.slug, `${args.slug}-${args.articleId}`];
  for (const candidate of candidates) {
    const conditions: SQL[] = [
      inArray(articleTranslations.locale, locales),
      eq(articleTranslations.slug, candidate),
    ];
    if (args.excludeArticleId != null) {
      conditions.push(ne(articleTranslations.articleId, args.excludeArticleId));
    }
    const clashes = await tx
      .select({ id: articleTranslations.id })
      .from(articleTranslations)
      .where(and(...conditions))
      .limit(1);
    if (clashes.length === 0) return candidate;
  }

  throw new Error(`could not disambiguate shared article slug "${args.slug}"`);
}
