import assert from 'node:assert/strict';
import {
  productSlugFromInput,
  resolveProductTranslationSlug,
} from '../src/lib/products';

function test(name: string, fn: () => void) {
  fn();
  console.log(`ok - ${name}`);
}

test('productSlugFromInput prefers explicit English slug input', () => {
  assert.equal(
    productSlugFromInput({ slug: '  Premium LED Mirror!  ', name: 'Ignored Name' }),
    'premium-led-mirror',
  );
});

test('productSlugFromInput falls back to English product name', () => {
  assert.equal(
    productSlugFromInput({ name: 'Round Backlit LED Bathroom Mirror' }),
    'round-backlit-led-bathroom-mirror',
  );
});

test('resolveProductTranslationSlug preserves existing non-English product URLs', () => {
  assert.equal(
    resolveProductTranslationSlug({
      locale: 'de',
      englishSlug: 'round-backlit-led-bathroom-mirror',
      existingSlug: 'runder-hinterleuchteter-led-badspiegel',
    }),
    'runder-hinterleuchteter-led-badspiegel',
  );
});

test('resolveProductTranslationSlug uses English URLs for newly translated products', () => {
  assert.equal(
    resolveProductTranslationSlug({
      locale: 'fr',
      englishSlug: 'round-backlit-led-bathroom-mirror',
      existingSlug: null,
    }),
    'round-backlit-led-bathroom-mirror',
  );
});

test('resolveProductTranslationSlug always uses the finalized English slug for English', () => {
  assert.equal(
    resolveProductTranslationSlug({
      locale: 'en',
      englishSlug: 'round-backlit-led-bathroom-mirror',
      existingSlug: 'old-english-slug',
    }),
    'round-backlit-led-bathroom-mirror',
  );
});
