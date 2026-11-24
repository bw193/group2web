import assert from 'node:assert/strict';
import test from 'node:test';
import { locales } from '../src/i18n/config';
import { isIndexableLocalePath, robotsForPublicPage } from '../src/lib/indexing';
import { buildLanguageAlternates } from '../src/lib/seo';

const PATHS = [
  '',
  '/about',
  '/contact',
  '/products',
  '/products/led-mirrors',
  '/products/led-mirrors/israel-round-mirror',
  '/insight',
  '/insight/sourcing/israel-lighting-guide',
  '/videos',
  '/videos/some-video',
  '/privacy',
];

test('no locale carries a robots override, Hebrew included', () => {
  for (const locale of locales) {
    assert.equal(robotsForPublicPage(locale), undefined, `unexpected robots for ${locale}`);
  }
});

test('every public path is indexable in every locale', () => {
  for (const locale of locales) {
    for (const path of PATHS) {
      assert.equal(isIndexableLocalePath(locale, path), true, `${locale} ${path || '/'} not indexable`);
    }
  }
});

test('the two indexing helpers never disagree', () => {
  // The invariant the sitemap and hreflang builders rely on: a path is
  // advertisable exactly when robotsForPublicPage would not mark it noindex.
  for (const locale of locales) {
    const robots = robotsForPublicPage(locale);
    // undefined => no override => indexable.
    const indexableByRobots = robots ? robots.index : true;
    for (const path of PATHS) {
      assert.equal(
        isIndexableLocalePath(locale, path),
        indexableByRobots,
        `disagreement for ${locale} ${path || '/'}`,
      );
    }
  }
});

test('every hreflang cluster lists Hebrew at its israel- address', () => {
  const expectedHebrew: Record<string, string> = {
    '': '/he/israel-home',
    '/about': '/he/israel-about',
    '/products': '/he/israel-products',
    '/products/led-mirrors': '/he/israel-products/israel-led-mirrors',
    '/products/led-mirrors/israel-round-mirror': '/he/israel-products/israel-led-mirrors/israel-round-mirror',
    '/insight/sourcing/israel-lighting-guide': '/he/israel-insight/israel-sourcing/israel-lighting-guide',
    // The video library keeps the generic path in Hebrew too.
    '/videos/some-video': '/he/videos/some-video',
  };

  for (const [path, hebrewPath] of Object.entries(expectedHebrew)) {
    const languages = buildLanguageAlternates(path);
    assert.equal(languages.he, `https://chengtaimirror.com${hebrewPath}`, `Hebrew hreflang for ${path || '/'}`);
    assert.deepEqual(
      Object.keys(languages).sort(),
      [...locales, 'x-default'].sort(),
      `missing alternates for ${path || '/'}`,
    );
    assert.equal(languages['x-default'], languages.en);
  }
});
