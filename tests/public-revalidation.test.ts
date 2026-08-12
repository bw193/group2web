import assert from 'node:assert/strict';
import test from 'node:test';
import { localizedRevalidationPaths } from '../src/lib/public-revalidation';

test('Hebrew indexes and home use canonical Israel paths', () => {
  assert.deepEqual(localizedRevalidationPaths('he', ''), ['/he/israel-home']);
  assert.deepEqual(localizedRevalidationPaths('he', '/products'), ['/he/israel-products']);
  assert.deepEqual(localizedRevalidationPaths('he', '/insight'), ['/he/israel-insight']);
});

test('Hebrew detail invalidation can include the legacy redirect path', () => {
  assert.deepEqual(
    localizedRevalidationPaths('he', '/products/israel-round-mirror', {
      includeLegacyHebrewPath: true,
    }),
    [
      '/he/israel-products/israel-round-mirror',
      '/he/products/israel-round-mirror',
    ],
  );
  assert.deepEqual(
    localizedRevalidationPaths('he', '/insight/israel-lighting-guide', {
      includeLegacyHebrewPath: true,
    }),
    [
      '/he/israel-insight/israel-lighting-guide',
      '/he/insight/israel-lighting-guide',
    ],
  );
});

test('non-Hebrew revalidation paths remain unchanged and are not duplicated', () => {
  assert.deepEqual(localizedRevalidationPaths('en', ''), ['/en']);
  assert.deepEqual(
    localizedRevalidationPaths('de', '/products/round-mirror', {
      includeLegacyHebrewPath: true,
    }),
    ['/de/products/round-mirror'],
  );
  assert.deepEqual(
    localizedRevalidationPaths('fr', '/insight/lighting-guide', {
      includeLegacyHebrewPath: true,
    }),
    ['/fr/insight/lighting-guide'],
  );
});
