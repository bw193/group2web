import assert from 'node:assert/strict';
import test from 'node:test';
import { locales } from '../src/i18n/config';
import { insightCategoryCopy } from '../src/lib/insight-category-copy';
import {
  canonicalPathAfterLocale,
  categoryKeyFromSegment,
  genericPathAfterLocale,
  insightArticlePathAfterLocale,
  insightCategoryPathAfterLocale,
  insightCategorySegment,
  localizedPath,
  localizedPathFromPathname,
} from '../src/lib/public-paths';
import { localizedRevalidationPaths } from '../src/lib/public-revalidation';
import { localizedSiteName, snippet, titleWithSiteName } from '../src/lib/seo';

test('an article sits under its category, and the category has a page of its own', () => {
  assert.equal(insightCategoryPathAfterLocale('sourcing'), '/insight/sourcing');
  assert.equal(insightArticlePathAfterLocale('sourcing', 'ip-ratings'), '/insight/sourcing/ip-ratings');
  assert.equal(localizedPath('en', insightCategoryPathAfterLocale('design')), '/en/insight/design');
  assert.equal(
    localizedPath('de', insightArticlePathAfterLocale('design', 'the-return-of-the-arched-mirror')),
    '/de/insight/design/the-return-of-the-arched-mirror',
  );
});

test('Hebrew prefixes the category segment and leaves the stored slug alone', () => {
  assert.equal(
    localizedPath('he', insightCategoryPathAfterLocale('sourcing')),
    '/he/israel-insight/israel-sourcing',
  );
  assert.equal(
    localizedPath('he', insightArticlePathAfterLocale('sourcing', 'israel-ip-ratings')),
    '/he/israel-insight/israel-sourcing/israel-ip-ratings',
  );
  assert.equal(localizedPath('he', '/insight'), '/he/israel-insight');
});

test('products keep their flat paths — this change is Insight only', () => {
  assert.equal(localizedPath('en', '/products/round-led-mirror'), '/en/products/round-led-mirror');
  assert.equal(
    localizedPath('he', '/products/israel-round-led-mirror'),
    '/he/israel-products/israel-round-led-mirror',
  );
  assert.equal(
    genericPathAfterLocale('he', '/israel-products/israel-round-led-mirror'),
    '/products/israel-round-led-mirror',
  );
});

test('Hebrew category paths round-trip through the generic form', () => {
  for (const hebrew of [
    '/israel-insight/israel-sourcing',
    '/israel-insight/israel-sourcing/israel-ip-ratings',
  ]) {
    assert.equal(canonicalPathAfterLocale('he', genericPathAfterLocale('he', hebrew)), hebrew);
  }
  assert.equal(
    genericPathAfterLocale('he', '/israel-insight/israel-sourcing/israel-ip-ratings'),
    '/insight/sourcing/israel-ip-ratings',
  );
});

test('the language switcher carries the category across locales', () => {
  assert.equal(localizedPathFromPathname('/en/insight/sourcing', 'he'), '/he/israel-insight/israel-sourcing');
  assert.equal(localizedPathFromPathname('/he/israel-insight/israel-sourcing', 'fr'), '/fr/insight/sourcing');
  assert.equal(localizedPathFromPathname('/es/insight/design/arched', 'it'), '/it/insight/design/arched');
});

test('each category has exactly one segment per locale, so routes can redirect the rest', () => {
  assert.equal(insightCategorySegment('en', 'craft'), 'craft');
  assert.equal(insightCategorySegment('he', 'craft'), 'israel-craft');
  assert.equal(categoryKeyFromSegment('he', 'israel-craft'), 'craft');
  // An unprefixed Hebrew segment still names the category, but it is not the
  // canonical segment — the route sees the mismatch and redirects.
  assert.equal(categoryKeyFromSegment('he', 'craft'), 'craft');
  assert.notEqual('craft', insightCategorySegment('he', 'craft'));
  // Other locales never strip anything.
  assert.equal(categoryKeyFromSegment('en', 'israel-craft'), 'israel-craft');
});

test('busting a Hebrew article also reaches its generic redirect route', () => {
  assert.deepEqual(
    localizedRevalidationPaths('he', insightArticlePathAfterLocale('sourcing', 'israel-ip-ratings'), {
      includeLegacyHebrewPath: true,
    }),
    [
      '/he/israel-insight/israel-sourcing/israel-ip-ratings',
      '/he/insight/sourcing/israel-ip-ratings',
    ],
  );
});

test('every category landing page has fitting copy in every locale', () => {
  const keys = ['sourcing', 'design', 'craft', 'manufacturing', 'technology', 'news', 'projects'];
  for (const locale of locales) {
    for (const key of keys) {
      const copy = insightCategoryCopy(locale, key);
      assert.ok(copy, `${locale}/${key}: no copy`);
      assert.ok(copy.heading.trim(), `${locale}/${key}: empty heading`);
      // The intro is also the meta description, so snippet() must leave it whole.
      assert.equal(snippet(copy.intro), copy.intro, `${locale}/${key}: intro would be cut`);
      const title = titleWithSiteName(copy.title, localizedSiteName(locale));
      assert.ok(title.length <= 65, `${locale}/${key}: title is ${title.length} characters`);
    }
  }
});

test('a category without copy falls back rather than failing', () => {
  assert.equal(insightCategoryCopy('en', 'not-a-category'), null);
  assert.deepEqual(insightCategoryCopy('xx', 'sourcing'), insightCategoryCopy('en', 'sourcing'));
});
