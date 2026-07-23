import assert from 'node:assert/strict';
import test from 'node:test';
import { robotsForPublicPage } from '../src/lib/indexing';

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
