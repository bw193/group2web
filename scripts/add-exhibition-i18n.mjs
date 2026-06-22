// String-based, minimal-diff insertion of home.exhibition.* into every locale JSON.
// Anchors on the `whyCta` line (last home key in all 7 locales).
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TRANSLATIONS = {
  en: {
    eyebrow: 'Worldwide Exhibitions',
    heading: 'Where Chengtai meets the world',
    body: 'From the Canton Fair to bath and lighting expos across Europe and North America, we meet our partners on every continent — face to face, year after year.',
    defaultCaption: 'International exhibition {n}',
  },
  es: {
    eyebrow: 'Exposiciones internacionales',
    heading: 'Donde Chengtai se encuentra con el mundo',
    body: 'Desde la Feria de Cantón hasta las ferias de baño e iluminación en Europa y Norteamérica, conocemos a nuestros socios cara a cara, año tras año.',
    defaultCaption: 'Exposición internacional {n}',
  },
  pt: {
    eyebrow: 'Exposições internacionais',
    heading: 'Onde a Chengtai encontra o mundo',
    body: 'Da Feira de Cantão às feiras de banho e iluminação na Europa e na América do Norte, encontramos nossos parceiros pessoalmente, ano após ano.',
    defaultCaption: 'Exposição internacional {n}',
  },
  fr: {
    eyebrow: 'Salons internationaux',
    heading: 'Là où Chengtai rencontre le monde',
    body: 'De la Foire de Canton aux salons du bain et de l\'éclairage en Europe et en Amérique du Nord, nous rencontrons nos partenaires en personne, année après année.',
    defaultCaption: 'Salon international {n}',
  },
  it: {
    eyebrow: 'Fiere internazionali',
    heading: 'Dove Chengtai incontra il mondo',
    body: 'Dalla Fiera di Canton alle fiere del bagno e dell\'illuminazione in Europa e Nord America, incontriamo i nostri partner di persona, anno dopo anno.',
    defaultCaption: 'Fiera internazionale {n}',
  },
  de: {
    eyebrow: 'Weltweite Messen',
    heading: 'Wo Chengtai die Welt trifft',
    body: 'Von der Canton Fair bis zu Bad- und Beleuchtungsmessen in Europa und Nordamerika — wir treffen unsere Partner persönlich, Jahr für Jahr.',
    defaultCaption: 'Internationale Messe {n}',
  },
  he: {
    eyebrow: 'תערוכות עולמיות',
    heading: 'המקום בו צ׳נגטאי פוגשת את העולם',
    body: 'מירידי קנטון ועד תערוכות אמבטיה ותאורה באירופה ובצפון אמריקה — אנחנו פוגשים את השותפים שלנו פנים אל פנים, שנה אחר שנה.',
    defaultCaption: 'תערוכה בינלאומית {n}',
  },
};

const ROOT = 'D:/group2web/src/i18n/messages';
// Match `"whyCta": "<value>"` (no trailing comma — it's the last key in `home`)
const ANCHOR = /^(\s*)"whyCta"\s*:\s*"((?:[^"\\]|\\.)*)"(\s*)$/m;

for (const [locale, copy] of Object.entries(TRANSLATIONS)) {
  const path = join(ROOT, `${locale}.json`);
  const src = readFileSync(path, 'utf8');

  if (src.includes('"exhibition"')) {
    console.log(`[skip] ${locale}: already present`);
    continue;
  }
  if (!ANCHOR.test(src)) {
    console.error(`[fail] ${locale}: anchor not found`);
    continue;
  }

  const block =
    `,\n` +
    `$1"exhibition": {\n` +
    `$1  "eyebrow": ${JSON.stringify(copy.eyebrow)},\n` +
    `$1  "heading": ${JSON.stringify(copy.heading)},\n` +
    `$1  "body": ${JSON.stringify(copy.body)},\n` +
    `$1  "defaultCaption": ${JSON.stringify(copy.defaultCaption)}\n` +
    `$1}`;

  const next = src.replace(ANCHOR, `$1"whyCta": "$2"${block}$3`);

  // Validate the result still parses as JSON
  try {
    JSON.parse(next);
  } catch (err) {
    console.error(`[fail] ${locale}: produced invalid JSON — ${err.message}`);
    continue;
  }
  writeFileSync(path, next, 'utf8');
  console.log(`[ok] ${locale}`);
}
