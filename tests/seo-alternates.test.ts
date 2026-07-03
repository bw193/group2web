import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLanguageAlternates,
  shouldIncludeSeoAlternate,
  shouldIncludeXDefault,
} from '../src/lib/seo';

test('non-Hebrew SEO alternates exclude Hebrew and keep x-default English', () => {
  const languages = buildLanguageAlternates('en', '/about');

  assert.deepEqual(Object.keys(languages).sort(), [
    'de',
    'en',
    'es',
    'fr',
    'it',
    'pt',
    'x-default',
  ]);
  assert.equal(languages.en, 'https://chengtaimirror.com/en/about');
  assert.equal(languages['x-default'], 'https://chengtaimirror.com/en/about');
  assert.equal(languages.he, undefined);
});

test('Hebrew SEO alternates only include Hebrew self alternate', () => {
  const languages = buildLanguageAlternates('he', '/about');

  assert.deepEqual(languages, {
    he: 'https://chengtaimirror.com/he/israel-about',
  });
});

test('SEO alternate grouping does not cross the Hebrew boundary', () => {
  assert.equal(shouldIncludeSeoAlternate('en', 'he'), false);
  assert.equal(shouldIncludeSeoAlternate('he', 'en'), false);
  assert.equal(shouldIncludeSeoAlternate('he', 'he'), true);
  assert.equal(shouldIncludeSeoAlternate('es', 'de'), true);
  assert.equal(shouldIncludeXDefault('en'), true);
  assert.equal(shouldIncludeXDefault('he'), false);
});
