import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RELATED_PRODUCT_COUNT,
  pickRelatedProducts,
  rankRelatedProducts,
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

// Twelve products in four shapes and three styles: alike in different degrees,
// and enough of them for every rule to hold at once.
const shapes = ['Oval', 'Round', 'Arch', 'Capsule'];
const styles = ['Backlit LED', 'Front Lit LED', 'Frameless'];
const grid = {
  products: Array.from({ length: 12 }, (_, i) => product(i + 1)),
  texts: shapes.flatMap((shape, s) => styles.map((style, t) => text(s * 3 + t + 1, `${shape} ${style} Bathroom Mirror`))),
};
// Twelve shapes plus a plain "LED Mirror" that is every one's nearest match.
const hubShapes = ['Oval', 'Round', 'Arch', 'Capsule', 'Square', 'Cloud', 'Pebble', 'Teardrop', 'Hexagon', 'Octagon', 'Leaf', 'Moon'];
const hub = {
  products: Array.from({ length: 13 }, (_, i) => product(i + 1)),
  texts: [...hubShapes.map((shape, i) => text(i + 1, `${shape} LED Mirror`)), text(13, 'LED Mirror')],
};
const cardsOf = (catalogue: { products: RelatedProductRow[]; texts: RelatedTextRow[] }) =>
  new Map(catalogue.products.map((p) => [p.id, pickRelatedProducts(p, catalogue.products, catalogue.texts, []).map((r) => r.id)]));
const inboundOf = (cards: Map<number, number[]>) => {
  const inbound = new Map([...cards.keys()].map((id) => [id, 0]));
  for (const list of cards.values()) for (const id of list) inbound.set(id, inbound.get(id)! + 1);
  return inbound;
};

test('the nearest products rank first, not the newest', () => {
  const ranked = rankRelatedProducts(catalog.products[0], catalog.products, catalog.texts, catalog.specs);
  assert.deepEqual(new Set(ranked.slice(0, 2).map((p) => p.id)), new Set([2, 3]));
  assert.equal(pickRelatedProducts(catalog.products[0], catalog.products, catalog.texts, catalog.specs).length, RELATED_PRODUCT_COUNT);
});

test('shared specifications rank a sibling above one that shares nothing', () => {
  const products = [1, 2, 3].map((id) => product(id));
  const texts = [text(1, 'Round Mirror'), text(2, 'Cabinet'), text(3, 'Cabinet')];
  const specs = [
    spec(1, 'Shape', 'Round'), spec(1, 'Frame', 'Aluminium'),
    spec(3, 'Shape', 'Round'), spec(3, 'Frame', 'Aluminium'),
  ];
  assert.equal(rankRelatedProducts(products[0], products, texts, specs)[0].id, 3);
});

test('the model series breaks a tie between equally worded siblings', () => {
  const products = [
    product(1, { modelNumber: 'CTL0061D-QFB' }),
    product(2, { modelNumber: 'G2012' }),
    product(3, { modelNumber: 'CTL0061D-AAA' }),
  ];
  const texts = [text(1, 'LED Mirror'), text(2, 'LED Mirror'), text(3, 'LED Mirror')];
  assert.equal(rankRelatedProducts(products[0], products, texts, [])[0].id, 3);
});

test('shared tags count towards relatedness', () => {
  const products = [
    product(1, { tags: '["anti-fog","hotel"]' }),
    product(2, { tags: '["outdoor"]' }),
    product(3, { tags: '["anti-fog","hotel"]' }),
  ];
  const texts = [text(1, 'Mirror'), text(2, 'Mirror'), text(3, 'Mirror')];
  assert.equal(rankRelatedProducts(products[0], products, texts, [])[0].id, 3);
});

test('scoring reads the default locale, so every language links the same products', () => {
  const products = [1, 2, 3].map((id) => product(id));
  const texts = [
    text(1, 'Oval LED Mirror'), text(2, 'Oval LED Mirror'), text(3, 'Wood Cabinet'),
    // Spanish rows that would reverse the ranking if they were scored.
    text(1, 'Espejo LED Ovalado', null, 'es'), text(2, 'Armario de Madera', null, 'es'), text(3, 'Espejo LED Ovalado', null, 'es'),
  ];
  assert.equal(rankRelatedProducts(products[0], products, texts, [])[0].id, 2);
  const english = texts.filter((t) => t.locale === 'en');
  for (const current of products) {
    assert.deepEqual(
      pickRelatedProducts(current, products, texts, []).map((p) => p.id),
      pickRelatedProducts(current, [...products], english, []).map((p) => p.id),
    );
  }
});

test('a category with no shared wording still fills every card', () => {
  const products = [1, 2, 3, 4].map((id) => product(id));
  const texts = [text(1, 'Alpha'), text(2, 'Beta'), text(3, 'Gamma'), text(4, 'Delta')];
  for (const current of products) {
    assert.equal(pickRelatedProducts(current, products, texts, []).length, RELATED_PRODUCT_COUNT);
  }
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
  for (const current of catalog.products) {
    assert.deepEqual(
      pickRelatedProducts(current, catalog.products, catalog.texts, catalog.specs).map((p) => p.id),
      pickRelatedProducts(current, shuffled, catalog.texts, catalog.specs).map((p) => p.id),
    );
  }
});

test('other categories, uncategorised products and inactive siblings are left out', () => {
  const products = [product(1), product(2), product(3, { categoryId: 2 }), product(4, { isActive: false })];
  const texts = [text(1, 'Mirror'), text(2, 'Mirror'), text(3, 'Mirror'), text(4, 'Mirror')];
  assert.deepEqual(pickRelatedProducts(products[0], products, texts, []).map((p) => p.id), [2]);
  assert.deepEqual(pickRelatedProducts({ ...product(9), categoryId: null }, products, texts, []), []);
});

test('a two-product category links the pair to each other', () => {
  const products = [product(1), product(2)];
  const texts = [text(1, 'Oval Mirror'), text(2, 'Round Mirror')];
  assert.deepEqual(pickRelatedProducts(products[0], products, texts, []).map((p) => p.id), [2]);
  assert.deepEqual(pickRelatedProducts(products[1], products, texts, []).map((p) => p.id), [1]);
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
  for (const catalogue of [{ products, texts }, grid, hub]) {
    const inbound = inboundOf(cardsOf(catalogue));
    assert.ok(Math.min(...inbound.values()) >= 1, `orphans: ${JSON.stringify([...inbound])}`);
  }
});

test('no card points back at a page that links to it', () => {
  for (const catalogue of [grid, hub]) {
    const cards = cardsOf(catalogue);
    for (const [from, list] of cards) {
      assert.equal(list.length, RELATED_PRODUCT_COUNT);
      for (const to of list) assert.ok(!cards.get(to)!.includes(from), `${from} <-> ${to}`);
    }
  }
});

test('the next page never repeats a card the visitor just saw', () => {
  for (const catalogue of [grid, hub]) {
    const cards = cardsOf(catalogue);
    for (const [from, list] of cards) {
      const seen = new Set([from, ...list]);
      for (const to of list) {
        const repeated = cards.get(to)!.filter((id) => seen.has(id));
        assert.deepEqual(repeated, [], `${from} -> ${to} repeats ${repeated}`);
      }
    }
  }
});

test('no product is on more than four sibling pages, however much it resembles the rest', () => {
  // "LED Mirror" is every product's nearest match...
  for (const p of hub.products.slice(0, 12)) {
    assert.equal(rankRelatedProducts(p, hub.products, hub.texts, [])[0].id, 13);
  }
  // ...but it is shown on four pages, not twelve.
  const inbound = inboundOf(cardsOf(hub));
  assert.equal(inbound.get(13), RELATED_PRODUCT_COUNT + 1);
  assert.ok(Math.max(...inbound.values()) <= RELATED_PRODUCT_COUNT + 1, JSON.stringify([...inbound]));
});

test('new text rows are scored afresh rather than served from an earlier call', () => {
  // Same product array, different wording: the second call must match a fresh computation.
  const renamed = grid.texts.map((t, i) => text(t.productId, grid.texts[(i * 5) % grid.texts.length].name));
  for (const p of grid.products) pickRelatedProducts(p, grid.products, grid.texts, []);
  const reused = grid.products.map((p) => pickRelatedProducts(p, grid.products, renamed, []).map((r) => r.id));
  const fresh = grid.products.map((p) => pickRelatedProducts(p, [...grid.products], renamed, []).map((r) => r.id));
  assert.deepEqual(reused, fresh);
  assert.notDeepEqual(reused, grid.products.map((p) => pickRelatedProducts(p, grid.products, grid.texts, []).map((r) => r.id)));
});
