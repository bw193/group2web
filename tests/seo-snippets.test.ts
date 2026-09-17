import assert from 'node:assert/strict';
import test from 'node:test';
import { leadingProse, plainText, snippet, titleWithSiteName } from '../src/lib/seo';

test('titleWithSiteName appends the site name when the result still fits', () => {
  assert.equal(
    titleWithSiteName('The return of the arched mirror', 'Chengtai Mirror'),
    'The return of the arched mirror - Chengtai Mirror',
  );
});

test('titleWithSiteName leaves a long title alone instead of pushing its words out of view', () => {
  const long = 'How to Evaluate an LED Bathroom Mirror Supplier: 7 Things Buyers Should Check';
  assert.equal(titleWithSiteName(long, 'Chengtai Mirror'), long);
});

test('titleWithSiteName never repeats the brand', () => {
  const branded = 'Professional LED Mirror Manufacturer in China | Chengtai Mirror Factory Tour';
  assert.equal(titleWithSiteName(branded, 'Chengtai Mirror'), branded);
  assert.equal(titleWithSiteName('Inside CHENGTAI', 'Chengtai Mirror'), 'Inside CHENGTAI');
  assert.equal(titleWithSiteName('מראות לאמבטיה', 'מראות Chengtai'), 'מראות לאמבטיה - מראות Chengtai');
});

test('plainText strips tags and decodes named and numeric entities', () => {
  assert.equal(
    plainText('<p>Hotel&nbsp;&amp;&nbsp;resort</p><p>it&rsquo;s &#8220;clear&#x201D;</p>'),
    'Hotel & resort it’s “clear”',
  );
  assert.equal(plainText(null), '');
  assert.equal(plainText('&bogus; &#9999999999;'), '&bogus; &#9999999999;');
});

test('leadingProse skips a pasted bold title and empty spacer paragraphs', () => {
  const body =
    '<p></p><p><strong>5 Mirror Maintenance Mistakes (and How to Fix Them)</strong></p><p>&nbsp;</p>' +
    '<p>Most mirror damage happens after installation.</p><p>Second paragraph.</p>';
  assert.equal(leadingProse(body), 'Most mirror damage happens after installation. Second paragraph.');
});

test('leadingProse skips a short unpunctuated title line but keeps real prose', () => {
  assert.equal(
    leadingProse('<p>2026 Bathroom Mirror Trends: Why Irregular Frames Are Gaining Attention</p><p>Mirror design is moving beyond rectangles.</p>'),
    'Mirror design is moving beyond rectangles.',
  );
  assert.equal(leadingProse('<p>A short opening sentence.</p><p>More.</p>'), 'A short opening sentence. More.');
});

test('leadingProse keeps a paragraph that is only partly bold', () => {
  assert.equal(leadingProse('<p><strong>Note:</strong> Mount the mirror on a stud.</p>'), 'Note: Mount the mirror on a stud.');
});

test('leadingProse falls back to all text when every paragraph looks like a heading', () => {
  assert.equal(leadingProse('<p><strong>Only a title</strong></p>'), 'Only a title');
});

test('leadingProse drops headings and tables from bodies without paragraphs', () => {
  assert.equal(leadingProse('<h2>Heading</h2>Body text here.<table><tr><td>cell</td></tr></table>'), 'Body text here.');
});

test('snippet leaves short text unchanged apart from whitespace', () => {
  assert.equal(snippet('  A short   description. '), 'A short description.');
  assert.equal(snippet(null), '');
});

test('snippet ends on a full sentence when one closes late enough', () => {
  const text = `${'a'.repeat(120)}. ${'b'.repeat(80)}`;
  assert.equal(snippet(text), `${'a'.repeat(120)}.`);
});

test('snippet otherwise cuts at a word boundary, without trailing punctuation, and adds an ellipsis', () => {
  const words = Array.from({ length: 40 }, (_, i) => `word${i},`).join(' ');
  const result = snippet(words);
  assert.ok(result.endsWith('…'));
  assert.ok(result.length <= 156, `too long: ${result.length}`);
  assert.ok(!/[,\s]…$/.test(result), 'punctuation left before the ellipsis');
  assert.ok(words.startsWith(result.slice(0, -1)));
});

test('snippet stays within the limit on unbroken text', () => {
  const result = snippet('x'.repeat(400));
  assert.equal(result.length, 156);
  assert.ok(result.endsWith('…'));
});
