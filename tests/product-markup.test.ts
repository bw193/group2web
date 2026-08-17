import assert from 'node:assert/strict';
import test from 'node:test';
import { ITEM_PAGE_MARKUP_PRODUCTS, usesItemPageMarkup } from '../src/lib/product-markup';

test('the staged rollout lists each product once', () => {
  const ids = ITEM_PAGE_MARKUP_PRODUCTS.map((p) => p.id);
  const slugs = ITEM_PAGE_MARKUP_PRODUCTS.map((p) => p.slug);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('staged products publish ItemPage, the rest keep Product', () => {
  for (const { id } of ITEM_PAGE_MARKUP_PRODUCTS) {
    assert.equal(usesItemPageMarkup(id), true);
  }
  // 16 and 17 are live catalog ids deliberately left out of the sample; the
  // comparison only means something while part of the catalog still ships
  // Product markup.
  assert.equal(usesItemPageMarkup(16), false);
  assert.equal(usesItemPageMarkup(17), false);
});
