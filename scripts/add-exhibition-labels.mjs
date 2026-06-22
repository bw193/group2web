// Adds home.exhibition.counterLabel + plateLabel into every locale JSON,
// inserting right after the existing exhibition.defaultCaption line. Minimal-diff.
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const LABELS = {
  en: { counterLabel: 'Exhibitions worldwide', plateLabel: 'International exhibition' },
  es: { counterLabel: 'Exposiciones en el mundo', plateLabel: 'Exposición internacional' },
  pt: { counterLabel: 'Exposições pelo mundo', plateLabel: 'Exposição internacional' },
  fr: { counterLabel: 'Salons dans le monde', plateLabel: 'Salon international' },
  it: { counterLabel: 'Fiere nel mondo', plateLabel: 'Fiera internazionale' },
  de: { counterLabel: 'Messen weltweit', plateLabel: 'Internationale Messe' },
  he: { counterLabel: 'תערוכות ברחבי העולם', plateLabel: 'תערוכה בינלאומית' },
};

const ROOT = 'D:/group2web/src/i18n/messages';
// Match the defaultCaption line (last key in the exhibition block).
const ANCHOR = /^(\s*)"defaultCaption"\s*:\s*"((?:[^"\\]|\\.)*)"(\s*)$/m;

for (const [locale, copy] of Object.entries(LABELS)) {
  const path = join(ROOT, `${locale}.json`);
  const src = readFileSync(path, 'utf8');

  if (src.includes('"counterLabel"')) {
    console.log(`[skip] ${locale}: already present`);
    continue;
  }
  if (!ANCHOR.test(src)) {
    console.error(`[fail] ${locale}: anchor not found`);
    continue;
  }

  const addition =
    `,\n` +
    `$1"counterLabel": ${JSON.stringify(copy.counterLabel)},\n` +
    `$1"plateLabel": ${JSON.stringify(copy.plateLabel)}`;

  const next = src.replace(ANCHOR, `$1"defaultCaption": "$2"${addition}$3`);

  try {
    JSON.parse(next);
  } catch (err) {
    console.error(`[fail] ${locale}: invalid JSON — ${err.message}`);
    continue;
  }
  writeFileSync(path, next, 'utf8');
  console.log(`[ok] ${locale}`);
}
