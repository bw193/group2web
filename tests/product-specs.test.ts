import assert from 'node:assert/strict';
import {
  planProductSpecUpdate,
  type ProductSpecInput,
  type ProductSpecRow,
} from '../src/lib/product-specs';

function test(name: string, fn: () => void) {
  fn();
  console.log(`ok - ${name}`);
}

type Pair = [string, string];

const TRANSLATED = ['de', 'es', 'fr', 'he', 'it', 'pt'];
const ALL_LOCALES = ['de', 'en', 'es', 'fr', 'he', 'it', 'pt'];

function rows(locale: string, pairs: readonly Pair[]): ProductSpecRow[] {
  return pairs.map(([specKey, specValue]) => ({ locale, specKey, specValue }));
}

/** What the CMS form sends: English rows only. */
function sent(pairs: readonly Pair[]): ProductSpecInput[] {
  return pairs.map(([key, value]) => ({ locale: 'en', key, value }));
}

const english: Pair[] = [['Model', 'T604'], ['Shape', 'Round'], ['Installation', 'Wall mounted']];

/** A product as stored: English plus six translations, in id order. */
const stored: ProductSpecRow[] = [
  ...rows('en', english),
  ...TRANSLATED.flatMap((locale) => rows(locale, english.map(([k, v]): Pair => [`${k} ${locale}`, `${v} ${locale}`]))),
];

const sorted = (locales: string[]) => [...locales].sort();

test('a save that leaves the English specs alone writes nothing', () => {
  assert.deepEqual(planProductSpecUpdate(stored, sent(english)), {
    deleteLocales: [],
    insertRows: [],
    englishChanged: false,
  });
});

test('changing an English value rewrites English and clears the translations', () => {
  const changed: Pair[] = [['Model', 'T604'], ['Shape', 'Oval'], ['Installation', 'Wall mounted']];
  const plan = planProductSpecUpdate(stored, sent(changed));
  assert.deepEqual(sorted(plan.deleteLocales), ALL_LOCALES);
  assert.deepEqual(plan.insertRows, rows('en', changed));
  assert.equal(plan.englishChanged, true);
});

test('changing an English key counts as a change', () => {
  const renamed: Pair[] = [['Model', 'T604'], ['Form', 'Round'], ['Installation', 'Wall mounted']];
  const plan = planProductSpecUpdate(stored, sent(renamed));
  assert.deepEqual(sorted(plan.deleteLocales), ALL_LOCALES);
  assert.equal(plan.englishChanged, true);
});

test('adding or removing an English row clears the translations', () => {
  for (const next of [[...english, ['Warranty', '3 years']], english.slice(0, 2)] as Pair[][]) {
    const plan = planProductSpecUpdate(stored, sent(next));
    assert.deepEqual(sorted(plan.deleteLocales), ALL_LOCALES);
    assert.deepEqual(plan.insertRows, rows('en', next));
    assert.equal(plan.englishChanged, true);
  }
});

test('an empty English list clears every language', () => {
  const plan = planProductSpecUpdate(stored, []);
  assert.deepEqual(sorted(plan.deleteLocales), ALL_LOCALES);
  assert.deepEqual(plan.insertRows, []);
  assert.equal(plan.englishChanged, true);
});

test('English rows in another order are rewritten and the translations kept', () => {
  // The CMS reads rows in storage order, which can differ from id order.
  const reordered = [...english].reverse();
  assert.deepEqual(planProductSpecUpdate(stored, sent(reordered)), {
    deleteLocales: ['en'],
    insertRows: rows('en', reordered),
    englishChanged: false,
  });
});

test('a repeated English row is a change, not a reorder', () => {
  const twoRows = rows('en', english.slice(0, 2));
  const plan = planProductSpecUpdate(twoRows, sent([english[0], english[0]]));
  assert.equal(plan.englishChanged, true);
  assert.deepEqual(plan.deleteLocales, ['en']);
});

test('rows without a locale count as English', () => {
  for (const locale of [undefined, null, '']) {
    const incoming = english.map(([key, value]) => ({ locale, key, value }));
    assert.deepEqual(planProductSpecUpdate(stored, incoming), {
      deleteLocales: [],
      insertRows: [],
      englishChanged: false,
    });
  }
});

test('a product without specs gets its English rows and no delete', () => {
  assert.deepEqual(planProductSpecUpdate([], sent(english)), {
    deleteLocales: [],
    insertRows: rows('en', english),
    englishChanged: true,
  });
  assert.deepEqual(planProductSpecUpdate([], []), {
    deleteLocales: [],
    insertRows: [],
    englishChanged: false,
  });
});

test('translated rows that are sent replace only their own language', () => {
  const german: ProductSpecInput = { locale: 'de', key: 'Modell', value: 'T604' };

  const sameEnglish = planProductSpecUpdate(stored, [...sent(english), german]);
  assert.deepEqual(sameEnglish, {
    deleteLocales: ['de'],
    insertRows: [{ locale: 'de', specKey: 'Modell', specValue: 'T604' }],
    englishChanged: false,
  });

  // With changed English, the languages that weren't sent are cleared;
  // German keeps the rows that came with the save.
  const changed: Pair[] = [['Model', 'T605']];
  const newEnglish = planProductSpecUpdate(stored, [...sent(changed), german]);
  assert.deepEqual(sorted(newEnglish.deleteLocales), ALL_LOCALES);
  assert.deepEqual(newEnglish.insertRows, [
    ...rows('en', changed),
    { locale: 'de', specKey: 'Modell', specValue: 'T604' },
  ]);
});
