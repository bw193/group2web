import assert from 'node:assert/strict';
import test from 'node:test';
import { locales } from '../src/i18n/config';
import {
  PRODUCT_CATEGORY_COVERS,
  PRODUCT_CATEGORY_SLUGS,
  productCategoryIdFromSlug,
  productCategorySlug,
  productCategoryTabs,
  productCategoryTiles,
} from '../src/lib/product-categories';
import { productCategoryCopy } from '../src/lib/product-category-copy';
import {
  canonicalPathAfterLocale,
  categoryKeyFromSegment,
  genericPathAfterLocale,
  localizedPath,
  localizedPathFromPathname,
  productCategoryPathAfterLocale,
  productCategorySegment,
  productPathAfterLocale,
} from '../src/lib/public-paths';
import { localizedRevalidationPaths } from '../src/lib/public-revalidation';
import { localizedSiteName, snippet, titleWithSiteName } from '../src/lib/seo';

test('each category id has one URL segment, and the segment leads back to the id', () => {
  assert.equal(productCategorySlug(1), 'led-mirrors');
  assert.equal(productCategorySlug(2), 'bathroom-mirrors');
  assert.equal(productCategorySlug(3), 'full-length-mirrors');
  assert.equal(productCategorySlug(4), 'mirror-cabinets');
  for (const [id, slug] of Object.entries(PRODUCT_CATEGORY_SLUGS)) {
    assert.equal(productCategoryIdFromSlug(slug), Number(id));
  }
  assert.equal(productCategorySlug(null), null);
  assert.equal(productCategorySlug(undefined), null);
  assert.equal(productCategoryIdFromSlug('round-backlit-led-mirror'), null);
});

test('a category added in the CMS later still gets a URL until it is given a slug', () => {
  assert.equal(productCategorySlug(9), 'category-9');
  assert.equal(productCategoryIdFromSlug('category-9'), 9);
  // Once a slug exists, the fallback segment still names the category, so the
  // route can see it is not the canonical one and redirect.
  assert.equal(productCategoryIdFromSlug('category-1'), 1);
  assert.notEqual('category-1', productCategorySlug(1));
});

test('a product sits under its category, and the category has a page of its own', () => {
  assert.equal(productCategoryPathAfterLocale('led-mirrors'), '/products/led-mirrors');
  assert.equal(
    productPathAfterLocale('led-mirrors', 'round-backlit-led-mirror'),
    '/products/led-mirrors/round-backlit-led-mirror',
  );
  assert.equal(
    localizedPath('de', productPathAfterLocale('mirror-cabinets', 'smart-arched-led-mirror-cabinet')),
    '/de/products/mirror-cabinets/smart-arched-led-mirror-cabinet',
  );
  // No category, no level: the product keeps the flat URL.
  assert.equal(productPathAfterLocale(null, 'round-backlit-led-mirror'), '/products/round-backlit-led-mirror');
});

test('Hebrew prefixes the category segment and leaves the stored slug alone', () => {
  assert.equal(localizedPath('he', '/products'), '/he/israel-products');
  assert.equal(
    localizedPath('he', productCategoryPathAfterLocale('led-mirrors')),
    '/he/israel-products/israel-led-mirrors',
  );
  assert.equal(
    localizedPath('he', productPathAfterLocale('led-mirrors', 'israel-round-backlit-led-mirror')),
    '/he/israel-products/israel-led-mirrors/israel-round-backlit-led-mirror',
  );
  // A flat Hebrew slug is already prefixed, so it is never doubled.
  assert.equal(
    localizedPath('he', productPathAfterLocale(null, 'israel-round-backlit-led-mirror')),
    '/he/israel-products/israel-round-backlit-led-mirror',
  );
});

test('Hebrew product paths round-trip through the generic form', () => {
  for (const hebrew of [
    '/israel-products',
    '/israel-products/israel-led-mirrors',
    '/israel-products/israel-led-mirrors/israel-round-backlit-led-mirror',
  ]) {
    assert.equal(canonicalPathAfterLocale('he', genericPathAfterLocale('he', hebrew)), hebrew);
  }
  assert.equal(
    genericPathAfterLocale('he', '/israel-products/israel-led-mirrors/israel-round-backlit-led-mirror'),
    '/products/led-mirrors/israel-round-backlit-led-mirror',
  );
});

test('the language switcher carries the category across locales', () => {
  assert.equal(
    localizedPathFromPathname('/en/products/led-mirrors', 'he'),
    '/he/israel-products/israel-led-mirrors',
  );
  assert.equal(
    localizedPathFromPathname('/he/israel-products/israel-bathroom-mirrors', 'fr'),
    '/fr/products/bathroom-mirrors',
  );
  assert.equal(
    localizedPathFromPathname('/es/products/mirror-cabinets/oval-wall-mount-bathroom-mirror-cabinet', 'it'),
    '/it/products/mirror-cabinets/oval-wall-mount-bathroom-mirror-cabinet',
  );
});

test('each category has exactly one segment per locale, so routes can redirect the rest', () => {
  assert.equal(productCategorySegment('en', 'led-mirrors'), 'led-mirrors');
  assert.equal(productCategorySegment('he', 'led-mirrors'), 'israel-led-mirrors');
  assert.equal(categoryKeyFromSegment('he', 'israel-led-mirrors'), 'led-mirrors');
  // An unprefixed Hebrew segment still names the category, but it is not the
  // canonical segment, so the route redirects.
  assert.equal(categoryKeyFromSegment('he', 'led-mirrors'), 'led-mirrors');
  assert.notEqual('led-mirrors', productCategorySegment('he', 'led-mirrors'));
});

test('busting a Hebrew product also reaches its generic redirect route', () => {
  assert.deepEqual(
    localizedRevalidationPaths(
      'he',
      productPathAfterLocale('led-mirrors', 'israel-round-backlit-led-mirror'),
      { includeLegacyHebrewPath: true },
    ),
    [
      '/he/israel-products/israel-led-mirrors/israel-round-backlit-led-mirror',
      '/he/products/led-mirrors/israel-round-backlit-led-mirror',
    ],
  );
});

test('only categories that hold a product get a tab, each linking to its landing page', () => {
  const categories = [
    { id: 1, name: 'LED Mirrors' },
    { id: 2, name: 'Bathroom Mirrors' },
    { id: 4, name: 'Mirror Cabinets' },
  ];
  const products = [{ categoryId: 4 }, { categoryId: 1 }, { categoryId: null }];
  assert.deepEqual(
    productCategoryTabs('de', products, categories, 'Alle').map((t) => [t.key, t.label, t.href]),
    [
      ['all', 'Alle', '/de/products'],
      ['led-mirrors', 'LED Mirrors', '/de/products/led-mirrors'],
      ['mirror-cabinets', 'Mirror Cabinets', '/de/products/mirror-cabinets'],
    ],
  );
  assert.deepEqual(
    productCategoryTabs('he', products, categories, 'הכל').map((t) => t.href),
    ['/he/israel-products', '/he/israel-products/israel-led-mirrors', '/he/israel-products/israel-mirror-cabinets'],
  );
});

test('each category tile counts its products and shows its chosen cover, or a stand-in', () => {
  const categories = [
    { id: 1, name: 'LED Mirrors' },
    { id: 2, name: 'Bathroom Mirrors' },
    { id: 3, name: 'Full-Length Mirrors' },
    { id: 4, name: 'Mirror Cabinets' },
  ];
  // Newest first, as the catalog loads them. Category 2's chosen cover isn't
  // here, so its newest featured product with a photo stands in; category 4
  // has nothing featured, so its newest product does; category 3 is empty.
  const products = [
    { id: 300, categoryId: 1, imageUrl: 'led-new.jpg', isFeatured: true },
    { id: PRODUCT_CATEGORY_COVERS[1], categoryId: 1, imageUrl: 'led-cover.jpg', isFeatured: false },
    { id: 201, categoryId: 2, imageUrl: null, isFeatured: true },
    { id: 200, categoryId: 2, imageUrl: 'bath-new.jpg', isFeatured: false },
    { id: 199, categoryId: 2, imageUrl: 'bath-featured.jpg', isFeatured: true },
    { id: 401, categoryId: 4, imageUrl: 'cabinet-new.jpg', isFeatured: false },
    { id: 400, categoryId: 4, imageUrl: 'cabinet-old.jpg', isFeatured: false },
    { id: 999, categoryId: null, imageUrl: 'loose.jpg', isFeatured: true },
  ];
  assert.deepEqual(
    productCategoryTiles('en', products, categories).map((t) => [t.key, t.label, t.href, t.count, t.imageUrl]),
    [
      ['led-mirrors', 'LED Mirrors', '/en/products/led-mirrors', 2, 'led-cover.jpg'],
      ['bathroom-mirrors', 'Bathroom Mirrors', '/en/products/bathroom-mirrors', 3, 'bath-featured.jpg'],
      ['mirror-cabinets', 'Mirror Cabinets', '/en/products/mirror-cabinets', 2, 'cabinet-new.jpg'],
    ],
  );
  assert.equal(productCategoryTiles('he', products, categories)[0].href, '/he/israel-products/israel-led-mirrors');
  for (const id of Object.keys(PRODUCT_CATEGORY_COVERS)) {
    assert.ok(PRODUCT_CATEGORY_SLUGS[Number(id)], `cover for unknown category ${id}`);
  }
});

test('every category landing page has fitting copy in every locale', () => {
  for (const locale of locales) {
    for (const key of Object.values(PRODUCT_CATEGORY_SLUGS)) {
      const copy = productCategoryCopy(locale, key);
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
  assert.equal(productCategoryCopy('en', 'category-9'), null);
  assert.deepEqual(productCategoryCopy('xx', 'led-mirrors'), productCategoryCopy('en', 'led-mirrors'));
});
