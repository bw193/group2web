import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_DESCRIPTION_CHARS,
  checkDescription,
  extractDescriptionImages,
  findDescriptionImageProblems,
  withResponsiveDescriptionImages,
} from '../src/lib/description-images';
import { findTranslationImageProblems } from '../src/lib/products';
import { normalizeText } from '../src/lib/similarity';

const BASE = 'https://example.supabase.co/storage/v1/object/public/assets/products';
const LAYERS = 'Layer structure of the 5 mm copper-free silver mirror in this front-lit LED mirror';

// What the CMS editor's DescriptionImage node writes.
function figure(description: string, src = `${BASE}/front-lit-led-mirror-3f9k2a-opt@1600.webp`): string {
  const alt = description.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const caption = description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<figure data-description-image=""><img src="${src}" alt="${alt}" width="1024" height="1024"><figcaption>${caption}</figcaption></figure>`;
}

test('reads each photo and its alt text, decoding entities', () => {
  const html = `<h3>Glass</h3>${figure('Edge & "black edge" check on the 5 mm mirror glass')}<p>Text</p>${figure(LAYERS)}`;
  assert.deepEqual(extractDescriptionImages(html), [
    { src: `${BASE}/front-lit-led-mirror-3f9k2a-opt@1600.webp`, description: 'Edge & "black edge" check on the 5 mm mirror glass' },
    { src: `${BASE}/front-lit-led-mirror-3f9k2a-opt@1600.webp`, description: LAYERS },
  ]);
  assert.deepEqual(extractDescriptionImages('<p>No photos</p>'), []);
  assert.deepEqual(extractDescriptionImages(null), []);
});

test('a raw ">" inside a quoted alt does not end the tag', () => {
  const html = `<img alt="Thickness > 5 mm on this backlit mirror model" src="${BASE}/a.webp">`;
  assert.deepEqual(extractDescriptionImages(html), [
    { src: `${BASE}/a.webp`, description: 'Thickness > 5 mm on this backlit mirror model' },
  ]);
});

test('a description needs six words and at most 300 characters', () => {
  assert.deepEqual(checkDescription('   '), { kind: 'missing' });
  assert.deepEqual(checkDescription('Copper-free silver mirror layers'), { kind: 'tooShort' });
  assert.deepEqual(checkDescription(`${'word '.repeat(70)}end`), { kind: 'tooLong' });
  assert.deepEqual(checkDescription('x'.repeat(MAX_DESCRIPTION_CHARS)), { kind: 'tooShort' });
  assert.equal(checkDescription(LAYERS), null);
});

test('case, punctuation and spacing do not make a description new', () => {
  const used = [{ productId: 40, productName: 'Round Backlit LED Mirror', description: LAYERS }];
  assert.deepEqual(checkDescription(`  ${LAYERS.toUpperCase()}!! `, { usedElsewhere: used }), {
    kind: 'usedElsewhere',
    productName: 'Round Backlit LED Mirror',
  });
  assert.deepEqual(checkDescription(LAYERS.replace(/ /g, '   '), { others: [LAYERS] }), { kind: 'repeatedHere' });
  assert.equal(checkDescription(`${LAYERS}, shown in cross-section`, { others: [LAYERS], usedElsewhere: used }), null);
});

test('a save lists every photo that breaks a rule, counting photos from 1', () => {
  const used = [{ productId: 40, productName: 'Round Backlit LED Mirror', description: 'Anti-fog pad behind the glass of this round backlit mirror' }];
  const html = [
    figure(LAYERS),
    figure('Mirror layers'),
    figure(LAYERS.toLowerCase()),
    figure('Anti-fog pad behind the glass of this round backlit mirror'),
    `<p><img src="${BASE}/pasted.webp"></p>`,
  ].join('');
  assert.deepEqual(findDescriptionImageProblems(html, used), [
    { kind: 'tooShort', photo: 2 },
    { kind: 'repeatedHere', photo: 3 },
    { kind: 'usedElsewhere', productName: 'Round Backlit LED Mirror', photo: 4 },
    { kind: 'missing', photo: 5 },
  ]);
  assert.deepEqual(findDescriptionImageProblems(`<p>Plain text</p>${figure(LAYERS)}`, used), []);
});

test('a product save checks other products only when its own photos pass', async () => {
  let queries = 0;
  const db = {
    select: () => ({
      from: () => ({
        where: async () => {
          queries += 1;
          return [{ productId: 40, name: 'Round Backlit LED Mirror', fullDescription: `<p>Glass</p>${figure(LAYERS)}` }];
        },
      }),
    }),
  };

  assert.equal(await findTranslationImageProblems(db, [{ locale: 'en', fullDescription: '<p>No photos</p>' }], 38), null);
  assert.deepEqual(await findTranslationImageProblems(db, [{ locale: 'en', fullDescription: figure('') }], 38), {
    locale: 'en',
    problems: [{ kind: 'missing', photo: 1 }],
  });
  assert.equal(queries, 0);

  assert.deepEqual(await findTranslationImageProblems(db, [{ locale: 'en', fullDescription: figure(LAYERS) }], 38), {
    locale: 'en',
    problems: [{ kind: 'usedElsewhere', productName: 'Round Backlit LED Mirror', photo: 1 }],
  });
  assert.equal(
    await findTranslationImageProblems(db, [{ locale: 'en', fullDescription: figure(`${LAYERS}, cut open`) }], 38),
    null,
  );
  assert.equal(queries, 2);
});

test('the caption is page text the Similarity Check reads, the alt text is not', () => {
  const words = normalizeText(figure(LAYERS)).split(' ');
  assert.equal(words.filter((w) => w === 'structure').length, 1);
});

test('the product page gets lazy, responsive description photos', () => {
  const out = withResponsiveDescriptionImages(figure(LAYERS));
  assert.match(out, /<img src="[^"]+-opt@1600\.webp" alt="[^"]+" width="1024" height="1024" loading="lazy" decoding="async" srcset="[^"]+-opt@384\.webp 384w, [^"]+-opt@768\.webp 768w, [^"]+-opt@1080\.webp 1080w, [^"]+-opt@1600\.webp 1600w" sizes="[^"]+">/);
  assert.match(out, /<figcaption>Layer structure/);

  // Single-size uploads load lazily but have no widths to offer.
  assert.equal(
    withResponsiveDescriptionImages(`<img src="${BASE}/plain.webp" alt="x" />`),
    `<img src="${BASE}/plain.webp" alt="x" loading="lazy" decoding="async">`,
  );
  // Attributes already present are left alone, and text without photos is untouched.
  const eager = `<img src="${BASE}/plain.webp" alt="x" loading="eager" decoding="sync">`;
  assert.equal(withResponsiveDescriptionImages(eager), eager);
  assert.equal(withResponsiveDescriptionImages('<p>5 > 4</p>'), '<p>5 > 4</p>');
});
