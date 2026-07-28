import assert from 'node:assert/strict';
import test from 'node:test';
import { isIndexableLocalePath, robotsForPublicPage } from '../src/lib/indexing';

test('Hebrew public pages are noindex and remain crawlable by default', () => {
  assert.deepEqual(robotsForPublicPage('he'), {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  });
});

test('the canonical Hebrew homepage remains indexable', () => {
  assert.deepEqual(robotsForPublicPage('he', { isCanonicalHebrewHome: true }), {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  });
});

test('other locales retain their existing robots policy', () => {
  assert.equal(robotsForPublicPage('en'), undefined);
  assert.equal(
    robotsForPublicPage('de', { isCanonicalHebrewHome: true }),
    undefined,
  );
});

test('isIndexableLocalePath mirrors robotsForPublicPage for Hebrew', () => {
  // Only the Hebrew homepage is indexable, so only it may be advertised.
  assert.equal(isIndexableLocalePath('he', ''), true);
  assert.equal(isIndexableLocalePath('he', '/about'), false);
  assert.equal(isIndexableLocalePath('he', '/contact'), false);
  assert.equal(isIndexableLocalePath('he', '/products'), false);
  assert.equal(isIndexableLocalePath('he', '/insight'), false);
  assert.equal(isIndexableLocalePath('he', '/products/some-mirror'), false);
  assert.equal(isIndexableLocalePath('he', '/insight/some-article'), false);
});

test('isIndexableLocalePath leaves every other locale indexable', () => {
  for (const locale of ['en', 'es', 'pt', 'fr', 'it', 'de']) {
    for (const path of ['', '/about', '/products', '/products/some-mirror']) {
      assert.equal(isIndexableLocalePath(locale, path), true);
    }
  }
});

test('the two indexing helpers never disagree', () => {
  // The invariant the sitemap and hreflang builders rely on: a path is
  // advertisable exactly when robotsForPublicPage would not mark it noindex.
  const cases: { locale: string; path: string }[] = [
    { locale: 'he', path: '' },
    { locale: 'he', path: '/about' },
    { locale: 'he', path: '/products/some-mirror' },
    { locale: 'en', path: '' },
    { locale: 'de', path: '/about' },
  ];

  for (const { locale, path } of cases) {
    const robots = robotsForPublicPage(locale, { isCanonicalHebrewHome: path === '' });
    // undefined => no override => indexable.
    const indexableByRobots = robots ? robots.index : true;
    assert.equal(
      isIndexableLocalePath(locale, path),
      indexableByRobots,
      `disagreement for ${locale} ${path || '/'}`,
    );
  }
});
