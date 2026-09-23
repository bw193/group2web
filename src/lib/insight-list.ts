import type { CategoryTab, DisplayArticle } from '@/components/public/insight/types';
import type { ArticleCategory, ArticleListItem } from '@/lib/insight';
import {
  insightArticlePathAfterLocale,
  insightCategoryPathAfterLocale,
  localizedPath,
} from '@/lib/public-paths';

/**
 * The presentation half of the Insight list: pure functions over the rows
 * lib/insight.ts loads. They sit apart from that module because it is
 * server-only (it touches the database), and these need to run in tests.
 * lib/insight.ts re-exports all of them, so callers import from there.
 */

/** Title-cased key, the last-resort label when no translation row exists. */
export function categoryFallbackLabel(key: string): string {
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : key;
}

/** The canonical path of a list item, in the locale that owns its translation. */
export function articleListItemPath(a: ArticleListItem): string {
  return localizedPath(a.translationLocale, insightArticlePathAfterLocale(a.category, a.slug));
}

/**
 * Card data for the journal list — shared by /insight and every
 * /insight/<category> page so the two can never render a story differently.
 * Cards link to the locale that owns the translation, not the page locale: an
 * English-fallback card on /pt/insight points at /en/..., never at a phantom
 * /pt/... that ISR would have to render on demand.
 */
export function toDisplayArticles(
  list: ArticleListItem[],
  categories: ArticleCategory[],
  locale: string,
  readLabel: (minutes: number) => string,
): DisplayArticle[] {
  const names = new Map(categories.map((c) => [c.key, c.name]));
  return list.map((a) => ({
    id: a.id,
    categoryKey: a.category,
    categoryLabel: names.get(a.category) ?? categoryFallbackLabel(a.category),
    dateLabel: formatArticleDate(a.publishedAt, locale),
    readLabel: readLabel(a.readMinutes),
    title: a.title,
    dek: a.dek,
    author: a.author,
    href: articleListItemPath(a),
    imagePath: a.thumbnailUrl || a.coverImageUrl,
  }));
}

/**
 * The rule-bar tabs: "all" plus every category that holds at least one story,
 * each linking to its landing page. An empty category gets no tab — it has no
 * page to link to (its URL redirects to the index).
 */
export function categoryTabs(
  locale: string,
  list: ArticleListItem[],
  categories: ArticleCategory[],
  allLabel: string,
): CategoryTab[] {
  const stocked = new Set(list.map((a) => a.category));
  return [
    { key: 'all', label: allLabel, href: localizedPath(locale, '/insight') },
    ...categories
      .filter((c) => stocked.has(c.key))
      .map((c) => ({
        key: c.key,
        label: c.name,
        href: localizedPath(locale, insightCategoryPathAfterLocale(c.key)),
      })),
  ];
}

export function formatArticleDate(publishedAt: string, locale: string): string {
  const d = new Date(publishedAt);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  }
}
