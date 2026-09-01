import assert from 'node:assert/strict';
import { splitVideoDescription } from '../src/lib/video-utils';

function test(name: string, fn: () => void) {
  fn();
  console.log(`ok - ${name}`);
}

test('splitVideoDescription keeps short copy whole', () => {
  const { intro, rest } = splitVideoDescription('A compact LED mirror walkthrough.\n\nShot at the factory.');
  assert.equal(intro, 'A compact LED mirror walkthrough. Shot at the factory.');
  assert.deepEqual(rest, []);
});

test('splitVideoDescription returns empty parts for missing copy', () => {
  assert.deepEqual(splitVideoDescription(null), { intro: '', rest: [] });
  assert.deepEqual(splitVideoDescription('   '), { intro: '', rest: [] });
});

test('splitVideoDescription cuts long copy at a sentence boundary', () => {
  const first =
    'This frameless irregular oval LED bathroom mirror combines an organic outline with a minimalist, frameless design, making it a distinctive option for modern bathroom product collections and interior projects.';
  const second =
    'The frosted edge lighting creates a soft ambient glow, while the touch sensor provides convenient control of the lighting and functions.';
  const third = 'OEM and ODM services are available for customers with specific requirements.';
  const { intro, rest } = splitVideoDescription(`${first} ${second}\n\n${third}`);

  assert.equal(intro, first);
  assert.deepEqual(rest, [second, third]);
});

test('splitVideoDescription preserves paragraph breaks in the overflow', () => {
  const opening = 'First sentence of the description that runs on long enough to matter for the header standfirst layout, giving the sidebar a clean single-sentence summary of the video content shown above the fold on the detail page and beyond the split threshold so the helper has to cut.';
  const paraTwo = 'Second paragraph with practical details.';
  const paraThree = 'Third paragraph with contact information.';
  const { intro, rest } = splitVideoDescription(`${opening}\n\n${paraTwo}\n\n${paraThree}`);

  assert.equal(intro, opening);
  assert.deepEqual(rest, [paraTwo, paraThree]);
});

test('splitVideoDescription moves copy without sentence breaks below in full', () => {
  const runOn = 'led mirror '.repeat(40).trim();
  const { intro, rest } = splitVideoDescription(runOn);
  assert.equal(intro, '');
  assert.deepEqual(rest, [runOn]);
});
