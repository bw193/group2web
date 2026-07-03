import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildArticleLocaleSwitchLinks,
  buildProductLocaleSwitchLinks,
} from '../src/lib/locale-switch-links';

test('product locale switch links point directly at final Hebrew Israel URLs', () => {
  const links = buildProductLocaleSwitchLinks([
    { locale: 'en', slug: 'led-mirror-cabinet-with-storage' },
    { locale: 'es', slug: 'led-mirror-cabinet-with-storage' },
    { locale: 'he', slug: 'israel-led-mirror-cabinet-with-storage' },
  ]);

  assert.equal(links.en, '/en/products/led-mirror-cabinet-with-storage');
  assert.equal(links.es, '/es/products/led-mirror-cabinet-with-storage');
  assert.equal(links.he, '/he/israel-products/israel-led-mirror-cabinet-with-storage');
  assert.ok(!links.he?.startsWith('/he/products/'));
});

test('Insight locale switch links point directly at final Hebrew Israel URLs', () => {
  const links = buildArticleLocaleSwitchLinks([
    { locale: 'en', slug: 'the-quiet-science-of-a-flattering-mirror-light' },
    { locale: 'de', slug: 'the-quiet-science-of-a-flattering-mirror-light' },
    { locale: 'he', slug: 'israel-the-quiet-science-of-a-flattering-mirror-light' },
  ]);

  assert.equal(links.en, '/en/insight/the-quiet-science-of-a-flattering-mirror-light');
  assert.equal(links.de, '/de/insight/the-quiet-science-of-a-flattering-mirror-light');
  assert.equal(links.he, '/he/israel-insight/israel-the-quiet-science-of-a-flattering-mirror-light');
  assert.ok(!links.he?.startsWith('/he/insight/'));
});

test('locale switch links ignore unsupported locales', () => {
  const links = buildProductLocaleSwitchLinks([
    { locale: 'en', slug: 'round-led-mirror' },
    { locale: 'zh', slug: 'round-led-mirror' },
  ]);

  assert.deepEqual(links, {
    en: '/en/products/round-led-mirror',
  });
});
