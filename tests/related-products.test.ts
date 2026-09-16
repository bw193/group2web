import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RELATED_PRODUCT_COUNT,
  orderCategoryProducts,
  pickRelatedProducts,
  type RelatedProductRow,
  type RelatedSpecRow,
  type RelatedTextRow,
} from '../src/lib/related-products';

const product = (id: number, over: Partial<RelatedProductRow> = {}): RelatedProductRow => ({
  id,
  categoryId: 1,
  isActive: true,
  // Higher id = newer, so "most recent" and "most similar" can disagree.
  createdAt: `2026-01-${String(id).padStart(2, '0')}T00:00:00Z`,
  modelNumber: null,
  tags: null,
  ...over,
});
const text = (productId: number, name: string, shortDescription: string | null = null, locale = 'en'): RelatedTextRow =>
  ({ productId, locale, name, shortDescription });
const spec = (productId: number, specKey: string, specValue: string, locale = 'en'): RelatedSpecRow =>
  ({ productId, locale, specKey, specValue });

// A target plus two close relatives (older) and three unrelated products (newer).
const catalog = {
  products: [1, 2, 3, 4, 5, 6].map((id) => product(id)),
  texts: [
    text(1, 'Oval Backlit LED Bathroom Mirror'),
    text(2, 'Oval Backlit LED Vanity Mirror'),
    text(3, 'Oval LED Bathroom Mirror'),
    text(4, 'Solid Wood Dressing Mirror'),
    text(5, 'Walnut Frame Full Length Mirror'),
    text(6, 'Mirror Cabinet With Open Shelving'),
  ],
  specs: [] as RelatedSpecRow[],
};

test('the nearest products win, not the newest', () => {
  const picked = pickRelatedProducts(catalog.products[0], catalog.products, catalog.texts, catalog.specs);
  assert.deepEqual(new Set(picked.slice(0, 2).map((p) => p.id)), new Set([2, 3]));
  assert.equal(picked.length, RELATED_PRODUCT_COUNT);
});

test('shared specifications rank a sibling above one that shares nothing', () => {
  const products = [1, 2, 3].map((id) => product(id));
  const texts = [text(1, 'Round Mirror'), text(2, 'Cabinet'), text(3, 'Cabinet')];
  const specs = [
    spec(1, 'Shape', 'Round'), spec(1, 'Frame', 'Aluminium'),
    spec(3, 'Shape', 'Round'), spec(3, 'Frame', 'Aluminium'),
  ];
  const picked = pickRelatedProducts(products[0], products, texts, specs, { count: 1, neighbourSlots: 0 });
  assert.deepEqual(picked.map((p) => p.id), [3]);
});

test('the model series breaks a tie between equally worded siblings', () => {
  const products = [
    product(1, { modelNumber: 'CTL0061D-QFB' }),
    product(2, { modelNumber: 'G2012' }),
    product(3, { modelNumber: 'CTL0061D-AAA' }),
  ];
  const texts = [text(1, 'LED Mirror'), text(2, 'LED Mirror'), text(3, 'LED Mirror')];
  assert.deepEqual(pickRelatedProducts(products[0], products, texts, [], { count: 1, neighbourSlots: 0 }).map((p) => p.id), [3]);
});

test('shared tags count towards relatedness', () => {
  const products = [
    product(1, { tags: '["anti-fog","hotel"]' }),
    product(2, { tags: '["outdoor"]' }),
    product(3, { tags: '["anti-fog","hotel"]' }),
  ];
  const texts = [text(1, 'Mirror'), text(2, 'Mirror'), text(3, 'Mirror')];
  assert.deepEqual(pickRelatedProducts(products[0], products, texts, [], { count: 1, neighbourSlots: 0 }).map((p) => p.id), [3]);
});

test('a category with no shared wording still fills every card, in catalog order', () => {
  const products = [1, 2, 3, 4].map((id) => product(id));
  const texts = [text(1, 'Alpha'), text(2, 'Beta'), text(3, 'Gamma'), text(4, 'Delta')];
  const picked = pickRelatedProducts(products[0], products, texts, []);
  assert.equal(picked.length, RELATED_PRODUCT_COUNT);
  assert.deepEqual(picked.map((p) => p.id), orderCategoryProducts(products.slice(1)).map((p) => p.id));
});

test('a product never lists itself and never repeats a sibling', () => {
  for (const current of catalog.products) {
    const ids = pickRelatedProducts(current, catalog.products, catalog.texts, catalog.specs).map((p) => p.id);
    assert.ok(!ids.includes(current.id), `${current.id} links to itself`);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('input order does not change the result', () => {
  const shuffled = [catalog.products[3], catalog.products[0], catalog.products[5], catalog.products[1], catalog.products[4], catalog.products[2]];
  assert.deepEqual(
    pickRelatedProducts(catalog.products[0], catalog.products, catalog.texts, catalog.specs).map((p) => p.id),
    pickRelatedProducts(catalog.products[0], shuffled, catalog.texts, catalog.specs).map((p) => p.id),
  );
});

test('scoring reads the default locale, so every language links the same products', () => {
  const products = [1, 2, 3].map((id) => product(id));
  const texts = [
    text(1, 'Oval LED Mirror'), text(2, 'Oval LED Mirror'), text(3, 'Wood Cabinet'),
    // Spanish rows that would reverse the ranking if they were scored.
    text(1, 'Espejo LED Ovalado', null, 'es'), text(2, 'Armario de Madera', null, 'es'), text(3, 'Espejo LED Ovalado', null, 'es'),
  ];
  assert.deepEqual(pickRelatedProducts(products[0], products, texts, [], { count: 1, neighbourSlots: 0 }).map((p) => p.id), [2]);
});

test('other categories, uncategorised products and inactive siblings are left out', () => {
  const products = [product(1), product(2), product(3, { categoryId: 2 }), product(4, { isActive: false })];
  const texts = [text(1, 'Mirror'), text(2, 'Mirror'), text(3, 'Mirror'), text(4, 'Mirror')];
  assert.deepEqual(pickRelatedProducts(products[0], products, texts, []).map((p) => p.id), [2]);
  assert.deepEqual(pickRelatedProducts({ ...product(9), categoryId: null }, products, texts, []), []);
});

test('every product is linked from at least one sibling page, even when it is nobody\'s nearest match', () => {
  // "Odd One Out" shares no wording with the rest: pure similarity leaves it orphaned.
  const products = [1, 2, 3, 4, 5, 6].map((id) => product(id));
  const texts = [
    text(1, 'Oval LED Bathroom Mirror'),
    text(2, 'Oval LED Vanity Mirror'),
    text(3, 'Oval LED Dressing Mirror'),
    text(4, 'Round LED Bathroom Mirror'),
    text(5, 'Rectangle LED Bathroom Mirror'),
    text(6, 'Odd One Out'),
  ];
  const inbound = new Map(products.map((p) => [p.id, 0]));
  for (const current of products) {
    for (const related of pickRelatedProducts(current, products, texts, [])) {
      inbound.set(related.id, (inbound.get(related.id) ?? 0) + 1);
    }
  }
  assert.ok(Math.min(...inbound.values()) >= 1, `orphans: ${JSON.stringify([...inbound])}`);

  // Without the reserved slot the same catalog does leave it unlinked.
  const pureInbound = new Map(products.map((p) => [p.id, 0]));
  for (const current of products) {
    for (const related of pickRelatedProducts(current, products, texts, [], { neighbourSlots: 0 })) {
      pureInbound.set(related.id, (pureInbound.get(related.id) ?? 0) + 1);
    }
  }
  assert.equal(pureInbound.get(6), 0);
});

test('the reserved card is the category neighbour, after the similarity picks', () => {
  const picked = pickRelatedProducts(catalog.products[0], catalog.products, catalog.texts, catalog.specs);
  assert.equal(picked.length, RELATED_PRODUCT_COUNT);
  // Slots 1-2 are the two close relatives; slot 3 is the neighbour in catalog order.
  assert.deepEqual(new Set(picked.slice(0, 2).map((p) => p.id)), new Set([2, 3]));
  const ordered = orderCategoryProducts(catalog.products).map((p) => p.id);
  const successor = ordered[(ordered.indexOf(1) + 1) % ordered.length];
  assert.equal(picked[2].id, successor);
});
