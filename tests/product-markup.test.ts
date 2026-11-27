import assert from 'node:assert/strict';
import test from 'node:test';
import { productPageJsonLd, type ProductPageMarkupInput } from '../src/lib/product-markup';

const url = 'https://chengtaimirror.com/en/products/led-mirrors/crystal-clear-acrylic-frame-led-mirror';
const input: ProductPageMarkupInput = {
  url,
  locale: 'en',
  name: 'Crystal Clear Acrylic Frame LED Mirror',
  description: 'Round LED bathroom mirror with a clear acrylic frame.',
  images: ['https://example.com/front.webp', 'https://example.com/side.webp'],
  brandName: 'Chengtai Mirror',
  modelNumber: 'CTL502',
  specs: [
    { specKey: 'Size', specValue: '760 mm' },
    { specKey: ' Waterproof ', specValue: ' IP44 ' },
    { specKey: 'Model', specValue: 'ctl502' },
    { specKey: 'Size', specValue: 'Custom' },
    { specKey: '', specValue: 'value without a name' },
  ],
  breadcrumbId: `${url}#breadcrumb`,
};

test("a product page is an ItemPage about the model's datasheet", () => {
  const ld = productPageJsonLd(input);
  assert.equal(ld['@type'], 'ItemPage');
  assert.equal(ld['@id'], `${url}#page`);
  assert.equal(ld.inLanguage, 'en');
  assert.deepEqual(ld.breadcrumb, { '@id': `${url}#breadcrumb` });
  assert.deepEqual(ld.primaryImageOfPage, { '@type': 'ImageObject', url: 'https://example.com/front.webp' });

  const model = ld.mainEntity as Record<string, unknown>;
  assert.equal(model['@type'], 'ProductModel');
  assert.equal(model['@id'], `${url}#model`);
  assert.equal(model.name, input.name);
  assert.deepEqual(model.image, input.images);
  assert.deepEqual(model.brand, { '@type': 'Brand', name: 'Chengtai Mirror' });
  assert.deepEqual(model.manufacturer, { '@id': 'https://chengtaimirror.com/#organization' });
  assert.equal(model.sku, 'CTL502');
  assert.equal(model.mpn, 'CTL502');
});

test('nothing in the markup is a Product', () => {
  // Search Console reports every Product without offers, review or
  // aggregateRating as an invalid item, and this catalog has none of the three.
  assert.doesNotMatch(JSON.stringify(productPageJsonLd(input)), /"@type":"Product"/);
});

test('spec lines mirror the visible table, minus blanks and the model number', () => {
  const model = productPageJsonLd(input).mainEntity as Record<string, unknown>;
  assert.deepEqual(model.additionalProperty, [
    { '@type': 'PropertyValue', name: 'Size', value: '760 mm' },
    { '@type': 'PropertyValue', name: 'Waterproof', value: 'IP44' },
    { '@type': 'PropertyValue', name: 'Size', value: 'Custom' },
  ]);

  const specs = Array.from({ length: 25 }, (_, i) => ({ specKey: `Spec ${i + 1}`, specValue: `${i + 1}` }));
  const capped = productPageJsonLd({ ...input, specs }).mainEntity as { additionalProperty: unknown[] };
  assert.equal(capped.additionalProperty.length, 20);
});

test('a product without a model number or specs leaves those properties out', () => {
  const model = productPageJsonLd({ ...input, modelNumber: null, specs: [] }).mainEntity as Record<string, unknown>;
  assert.equal('sku' in model, false);
  assert.equal('mpn' in model, false);
  assert.equal('additionalProperty' in model, false);
});
