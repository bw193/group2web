import assert from 'node:assert/strict';
import test from 'node:test';
import type { ArticleCategory, ArticleListItem } from '../src/lib/insight';
import { articleListItemPath, categoryTabs, toDisplayArticles } from '../src/lib/insight-list';

const categories: ArticleCategory[] = [
  { key: 'craft', name: 'Craft' },
  { key: 'projects', name: 'Projects' },
  { key: 'sourcing', name: 'Sourcing' },
];

function item(overrides: Partial<ArticleListItem>): ArticleListItem {
  return {
    id: 1,
    category: 'sourcing',
    slug: 'ip-ratings',
    title: 'Specifying IP ratings',
    dek: null,
    author: null,
    readMinutes: 6,
    publishedAt: '2026-02-24T00:00:00Z',
    coverImageUrl: null,
    thumbnailUrl: null,
    translationLocale: 'en',
    ...overrides,
  };
}

test('only categories that hold a story get a tab, each linking to its landing page', () => {
  const list = [item({ id: 1, category: 'sourcing' }), item({ id: 2, category: 'craft' })];
  const tabs = categoryTabs('de', list, categories, 'Alle');
  assert.deepEqual(
    tabs.map((t) => [t.key, t.href]),
    [
      ['all', '/de/insight'],
      ['craft', '/de/insight/craft'],
      ['sourcing', '/de/insight/sourcing'],
    ],
  );
});

test('Hebrew tabs use the israel- paths', () => {
  const tabs = categoryTabs('he', [item({ category: 'craft' })], categories, 'הכול');
  assert.deepEqual(
    tabs.map((t) => t.href),
    ['/he/israel-insight', '/he/israel-insight/israel-craft'],
  );
});

test('cards link to the nested URL in the locale that owns the translation', () => {
  // An English-fallback card on a Portuguese page must not invent /pt/... .
  assert.equal(
    articleListItemPath(item({ translationLocale: 'en' })),
    '/en/insight/sourcing/ip-ratings',
  );
  const [card] = toDisplayArticles(
    [item({ translationLocale: 'pt', slug: 'ip-ratings' })],
    categories,
    'pt',
    (minutes) => `${minutes} min`,
  );
  assert.equal(card.href, '/pt/insight/sourcing/ip-ratings');
  assert.equal(card.categoryLabel, 'Sourcing');
  assert.equal(card.readLabel, '6 min');
});

test('a card in a category missing from the list still gets a label', () => {
  const [card] = toDisplayArticles([item({ category: 'news' })], categories, 'en', String);
  assert.equal(card.categoryLabel, 'News');
  assert.equal(card.href, '/en/insight/news/ip-ratings');
});
