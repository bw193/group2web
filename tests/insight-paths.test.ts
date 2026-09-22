import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalPathAfterLocale,
  categoryKeyFromSegment,
  genericPathAfterLocale,
  hebrewCategorySegment,
  insightArticlePathAfterLocale,
  insightCategoryPathAfterLocale,
  localizedPath,
  localizedPathFromPathname,
} from '../src/lib/public-paths';
import { insightCategoryCopy } from '../src/lib/insight-category-copy';
import { snippet, titleWithSiteName } from '../src/lib/seo';
import { locales } from '../src/i18n/config';

test('insight paths nest an article under its category', () => {
  assert.equal(insightCategoryPathAfterLocale('sourcing'), '/insight/sourcing');
  assert.equal(
    insightArticlePathAfterLocale('sourcing', 'how-to-install-an-led-mirror'),
    '/insight/sourcing/how-to-install-an-led-mirror',
  );
  assert.equal(localizedPath('en', insightCategoryPathAfterLocale('design')), '/en/insight/design');
  assert.equal(
    localizedPath('es', insightArticlePathAfterLocale('design', 'arched-mirrors')),
    '/es/insight/design/arched-mirrors',
  );
});

test('the Hebrew category segment carries the israel- prefix, the slug keeps its own', () => {
  assert.equal(
    localizedPath('he', insightCategoryPathAfterLocale('sourcing')),
    '/he/israel-insight/israel-sourcing',
  );
  assert.equal(
    localizedPath('he', insightArticlePathAfterLocale('sourcing', 'israel-led-mirror-guide')),
    '/he/israel-insight/israel-sourcing/israel-led-mirror-guide',
  );
  // The index itself is unchanged by the nesting.
  assert.equal(localizedPath('he', '/insight'), '/he/israel-insight');
});

test('hebrewCategorySegment and categoryKeyFromSegment are inverse and idempotent', () => {
  assert.equal(hebrewCategorySegment('craft'), 'israel-craft');
  assert.equal(hebrewCategorySegment('israel-craft'), 'israel-craft');
  assert.equal(categoryKeyFromSegment('he', 'israel-craft'), 'craft');
  assert.equal(categoryKeyFromSegment('he', 'craft'), 'craft');
  // Other locales never strip anything, so a key that starts with "israel"
  // would survive intact.
  assert.equal(categoryKeyFromSegment('en', 'israel-craft'), 'israel-craft');
});

test('Hebrew nested paths round-trip through the generic form', () => {
  const hebrewArticle = '/israel-insight/israel-sourcing/israel-led-mirror-guide';
  assert.equal(
    genericPathAfterLocale('he', hebrewArticle),
    '/insight/sourcing/israel-led-mirror-guide',
  );
  assert.equal(canonicalPathAfterLocale('he', genericPathAfterLocale('he', hebrewArticle)), hebrewArticle);

  const hebrewCategory = '/israel-insight/israel-sourcing';
  assert.equal(genericPathAfterLocale('he', hebrewCategory), '/insight/sourcing');
  assert.equal(canonicalPathAfterLocale('he', genericPathAfterLocale('he', hebrewCategory)), hebrewCategory);
});

test('locale switching keeps the category segment in the target locale form', () => {
  assert.equal(
    localizedPathFromPathname('/he/israel-insight/israel-sourcing', 'en'),
    '/en/insight/sourcing',
  );
  assert.equal(
    localizedPathFromPathname('/en/insight/sourcing', 'he'),
    '/he/israel-insight/israel-sourcing',
  );
});

test('every category page has landing copy in every locale', () => {
  // The keys the CMS ships with. A key missing here falls back to the category
  // name, which is tested below — but these six carry live articles.
  const keys = ['craft', 'design', 'manufacturing', 'projects', 'sourcing', 'technology', 'news'];
  for (const locale of locales) {
    for (const key of keys) {
      const copy = insightCategoryCopy(locale, key);
      assert.ok(copy, `${locale}/${key} has no copy`);
      assert.ok(copy.heading.length > 3, `${locale}/${key} heading too short`);
      // The intro doubles as the meta description, so it has to survive
      // `snippet` without being cut mid-thought.
      assert.equal(snippet(copy.intro), copy.intro, `${locale}/${key} intro is trimmed`);
      assert.ok(
        titleWithSiteName(copy.heading, 'Chengtai Mirror').length <= 65,
        `${locale}/${key} title too long for a SERP`,
      );
    }
  }
});

test('an unknown category has no copy, so the page falls back to the CMS name', () => {
  assert.equal(insightCategoryCopy('en', 'not-a-category'), null);
  assert.equal(insightCategoryCopy('de', 'not-a-category'), null);
});

test('a locale without its own copy falls back to English rather than nothing', () => {
  const copy = insightCategoryCopy('zz', 'sourcing');
  assert.ok(copy);
  assert.equal(copy.heading, insightCategoryCopy('en', 'sourcing')?.heading);
});
