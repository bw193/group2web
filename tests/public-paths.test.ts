import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalPathAfterLocale,
  genericPathAfterLocale,
  localizedPath,
  localizedPathFromPathname,
} from '../src/lib/public-paths';

test('localizedPath maps Hebrew static pages to Israel-specific paths', () => {
  assert.equal(localizedPath('he', ''), '/he/israel-home');
  assert.equal(localizedPath('he', '/about'), '/he/israel-about');
  assert.equal(localizedPath('he', '/contact'), '/he/israel-contact');
  assert.equal(localizedPath('he', '/contact/thank-you'), '/he/israel-contact/israel-thank-you');
});

test('localizedPath maps Hebrew product and Insight sections while preserving slugs and queries', () => {
  assert.equal(
    localizedPath('he', '/products/israel-round-backlit-led-mirror'),
    '/he/israel-products/israel-round-backlit-led-mirror',
  );
  assert.equal(
    localizedPath('he', '/insight/israel-the-quiet-science-of-a-flattering-mirror-light'),
    '/he/israel-insight/israel-the-quiet-science-of-a-flattering-mirror-light',
  );
  assert.equal(
    localizedPath('he', '/contact?product=Round%20Mirror'),
    '/he/israel-contact?product=Round%20Mirror',
  );
});

test('localizedPath leaves non-Hebrew paths unchanged', () => {
  assert.equal(localizedPath('en', ''), '/en');
  assert.equal(localizedPath('de', '/about'), '/de/about');
  assert.equal(localizedPath('es', '/products/round-backlit-led-mirror'), '/es/products/round-backlit-led-mirror');
});

test('genericPathAfterLocale reverses Hebrew public paths for locale switching', () => {
  assert.equal(genericPathAfterLocale('he', '/israel-home'), '');
  assert.equal(genericPathAfterLocale('he', '/israel-about'), '/about');
  assert.equal(genericPathAfterLocale('he', '/israel-products/israel-round-backlit-led-mirror'), '/products/israel-round-backlit-led-mirror');
  assert.equal(canonicalPathAfterLocale('he', genericPathAfterLocale('he', '/israel-insight/israel-story')), '/israel-insight/israel-story');
});

test('localizedPathFromPathname switches static Hebrew paths through generic routes', () => {
  assert.equal(localizedPathFromPathname('/he/israel-about', 'en'), '/en/about');
  assert.equal(localizedPathFromPathname('/en/about', 'he'), '/he/israel-about');
});
