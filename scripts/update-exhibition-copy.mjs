// Updates home.exhibition.heading + body in every locale, targeted to the
// exhibition block only (workflow also has heading/body keys). Minimal-diff.
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const T = {
  en: {
    heading: 'Meet Chengtai Mirror at Global Trade Shows',
    body: 'We welcome global buyers, distributors, and project partners to visit our booth, explore our latest mirror designs, and discuss tailored solutions for upcoming projects.',
  },
  es: {
    heading: 'Conozca a Chengtai Mirror en Ferias Internacionales',
    body: 'Damos la bienvenida a compradores, distribuidores y socios de proyectos de todo el mundo para que visiten nuestro stand, descubran nuestros últimos diseños de espejos y comenten soluciones a medida para próximos proyectos.',
  },
  pt: {
    heading: 'Conheça a Chengtai Mirror em Feiras Internacionais',
    body: 'Damos as boas-vindas a compradores, distribuidores e parceiros de projeto de todo o mundo para visitar o nosso stand, conhecer os nossos mais recentes designs de espelhos e discutir soluções personalizadas para próximos projetos.',
  },
  fr: {
    heading: 'Rencontrez Chengtai Mirror dans les Salons Internationaux',
    body: "Nous accueillons les acheteurs, distributeurs et partenaires de projet du monde entier pour visiter notre stand, découvrir nos derniers designs de miroirs et discuter de solutions sur mesure pour vos futurs projets.",
  },
  it: {
    heading: 'Incontra Chengtai Mirror alle Fiere Internazionali',
    body: "Diamo il benvenuto ad acquirenti, distributori e partner di progetto da tutto il mondo per visitare il nostro stand, scoprire i nostri ultimi design di specchi e discutere soluzioni su misura per i progetti futuri.",
  },
  de: {
    heading: 'Treffen Sie Chengtai Mirror auf internationalen Messen',
    body: 'Wir heißen Einkäufer, Händler und Projektpartner aus aller Welt an unserem Stand willkommen, um unsere neuesten Spiegeldesigns zu entdecken und maßgeschneiderte Lösungen für kommende Projekte zu besprechen.',
  },
  he: {
    heading: 'פגשו את Chengtai Mirror בתערוכות בינלאומיות',
    body: 'אנו מזמינים קונים, מפיצים ושותפי פרויקטים מכל העולם לבקר בביתן שלנו, להכיר את עיצובי המראות החדשים שלנו ולדון בפתרונות מותאמים אישית לפרויקטים הקרובים.',
  },
};

const ROOT = 'D:/group2web/src/i18n/messages';
const esc = (s) => JSON.stringify(s).replace(/\$/g, '$$$$');

for (const [locale, c] of Object.entries(T)) {
  const path = join(ROOT, `${locale}.json`);
  let src = readFileSync(path, 'utf8');

  const headingRe = /("exhibition":\s*\{\s*"eyebrow":\s*"[^"]*",\s*"heading":\s*)"[^"]*"/;
  const bodyRe = /("exhibition":\s*\{\s*"eyebrow":\s*"[^"]*",\s*"heading":\s*"[^"]*",\s*"body":\s*)"[^"]*"/;

  if (!headingRe.test(src) || !bodyRe.test(src)) {
    console.error(`[fail] ${locale}: exhibition heading/body anchor not found`);
    continue;
  }

  src = src.replace(headingRe, `$1${esc(c.heading)}`);
  src = src.replace(bodyRe, `$1${esc(c.body)}`);

  try {
    const parsed = JSON.parse(src);
    if (parsed.home.exhibition.heading !== c.heading || parsed.home.exhibition.body !== c.body) {
      console.error(`[fail] ${locale}: post-write value mismatch`);
      continue;
    }
  } catch (err) {
    console.error(`[fail] ${locale}: invalid JSON — ${err.message}`);
    continue;
  }
  writeFileSync(path, src, 'utf8');
  console.log(`[ok] ${locale}`);
}
