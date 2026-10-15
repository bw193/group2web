import { defaultLocale, locales, type Locale } from '@/i18n/config';

/**
 * Landing copy for the product category pages (/products/<category>), the
 * catalog's counterpart to insight-category-copy.ts.
 *
 * - `title`   the <title>: the category's product line plus one buyer term
 *             from keywords.md (wholesale, OEM, custom). One, not a stack of
 *             manufacturer/supplier/factory synonyms — that pattern is what
 *             088bbe4 trimmed after the September 2026 spam update.
 *             titleWithSiteName appends the brand when it fits.
 * - `heading` the H1.
 * - `intro`   one sentence under the H1 that is also the meta description, so
 *             it stays inside snippet()'s 155 characters (tests hold every
 *             locale to that).
 *
 * Each intro names what the category actually holds, checked against the
 * catalog: the LED category's anti-fog, dimming and colour-temperature claims
 * each cover more than half of its products, and the cabinets are described
 * by their doors, shelves and finishes rather than a mounting type only some
 * of them have. No place names (the Insight landing pages dropped them too).
 * Keys are the slugs in product-categories.ts. A category added in the CMS
 * later still gets a working page: it falls back to its CMS name and the
 * catalog description.
 */
export interface ProductCategoryCopy {
  title: string;
  heading: string;
  intro: string;
}

const CATEGORY_COPY: Record<Locale, Record<string, ProductCategoryCopy>> = {
  en: {
    'led-mirrors': {
      title: 'LED Bathroom Mirrors for Wholesale & OEM',
      heading: 'LED bathroom mirrors',
      intro:
        'Backlit, front-lit and smart LED mirrors in round, oval, arched and organic shapes, with touch dimming, colour-temperature and anti-fog options.',
    },
    'bathroom-mirrors': {
      title: 'Wholesale Bathroom Mirrors: Framed & Frameless',
      heading: 'Bathroom mirrors',
      intro:
        'Framed and frameless bathroom mirrors without built-in lighting: round, oval, arched and organic shapes in wood, metal or PS frames, in custom sizes.',
    },
    'full-length-mirrors': {
      title: 'Custom Full-Length & Dressing Mirrors',
      heading: 'Full-length and dressing mirrors',
      intro:
        'Full-length floor, wall and dressing mirrors, framed in solid wood, walnut, metal or PS, or frameless in organic shapes, made to order.',
    },
    'mirror-cabinets': {
      title: 'LED & Bathroom Mirror Cabinets for OEM Orders',
      heading: 'Bathroom mirror cabinets',
      intro:
        'Bathroom mirror cabinets with or without LED light: double and triple-door, open-shelf and smart designs in oak, walnut-grain and brushed-gold finishes.',
    },
  },
  es: {
    'led-mirrors': {
      title: 'Espejos de baño LED para mayoristas y OEM',
      heading: 'Espejos de baño LED',
      intro:
        'Espejos LED retroiluminados, frontales o inteligentes: redondos, ovalados, en arco u orgánicos, con regulación táctil, temperatura de color y antivaho.',
    },
    'bathroom-mirrors': {
      title: 'Espejos de baño al por mayor: con y sin marco',
      heading: 'Espejos de baño',
      intro:
        'Espejos de baño con y sin marco, sin luz integrada: formas redondas, ovaladas, en arco y orgánicas, con marco de madera, metal o PS, a medida.',
    },
    'full-length-mirrors': {
      title: 'Espejos de cuerpo entero y vestidor a medida',
      heading: 'Espejos de cuerpo entero y vestidor',
      intro:
        'Espejos de pie, de pared y de vestidor a altura completa, con marco de madera maciza, nogal, metal o PS, o sin marco en formas orgánicas, por encargo.',
    },
    'mirror-cabinets': {
      title: 'Armarios con espejo LED y de baño para OEM',
      heading: 'Armarios de baño con espejo',
      intro:
        'Armarios de baño con espejo, con o sin luz LED: de dos y tres puertas, con estantes abiertos o inteligentes, en roble, veta de nogal y oro cepillado.',
    },
  },
  pt: {
    'led-mirrors': {
      title: 'Espelhos de banheiro LED para atacado e OEM',
      heading: 'Espelhos de banheiro LED',
      intro:
        'Espelhos LED retroiluminados, de luz frontal e inteligentes, redondos, ovais, em arco ou orgânicos, com dimmer touch, temperatura de cor e antiembaçante.',
    },
    'bathroom-mirrors': {
      title: 'Espelhos de banheiro no atacado: com e sem moldura',
      heading: 'Espelhos de banheiro',
      intro:
        'Espelhos de banheiro com e sem moldura, sem luz embutida: formatos redondos, ovais, em arco e orgânicos, em madeira, metal ou PS, sob medida.',
    },
    'full-length-mirrors': {
      title: 'Espelhos de corpo inteiro e de vestir sob medida',
      heading: 'Espelhos de corpo inteiro',
      intro:
        'Espelhos de chão, de parede e de vestir em altura total, com moldura de madeira maciça, nogueira, metal ou PS, ou sem moldura em formas orgânicas.',
    },
    'mirror-cabinets': {
      title: 'Armários com espelho LED e de banheiro para OEM',
      heading: 'Armários de banheiro com espelho',
      intro:
        'Armários de banheiro com espelho, com ou sem luz LED: de duas e três portas, com prateleiras abertas ou inteligentes, em carvalho, nogueira e dourado.',
    },
  },
  fr: {
    'led-mirrors': {
      title: 'Miroirs de salle de bains LED : gros et OEM',
      heading: 'Miroirs LED de salle de bains',
      intro:
        'Miroirs LED rétroéclairés, à éclairage frontal ou connectés, ronds, ovales, en arche ou organiques : variateur tactile, température de couleur, anti-buée.',
    },
    'bathroom-mirrors': {
      title: 'Miroirs de salle de bains en gros, avec ou sans cadre',
      heading: 'Miroirs de salle de bains',
      intro:
        'Miroirs de salle de bains avec ou sans cadre, sans éclairage intégré : formes rondes, ovales, en arche ou organiques, cadre bois, métal ou PS, sur mesure.',
    },
    'full-length-mirrors': {
      title: 'Miroirs en pied et psychés sur mesure',
      heading: 'Miroirs en pied et psychés',
      intro:
        'Miroirs en pied à poser ou muraux et psychés, cadre en bois massif, noyer, métal ou PS, ou sans cadre aux formes organiques, faits sur commande.',
    },
    'mirror-cabinets': {
      title: 'Armoires de toilette LED à miroir pour l’OEM',
      heading: 'Armoires de toilette à miroir',
      intro:
        'Armoires de toilette à miroir, avec ou sans LED : deux ou trois portes, étagères ouvertes ou modèles connectés, en chêne, veinage noyer ou or brossé.',
    },
  },
  it: {
    'led-mirrors': {
      title: 'Specchi da bagno LED per ingrosso e OEM',
      heading: 'Specchi da bagno LED',
      intro:
        'Specchi LED retroilluminati, a luce frontale e smart, tondi, ovali, ad arco o organici, con dimmer touch, temperatura colore regolabile e antiappannamento.',
    },
    'bathroom-mirrors': {
      title: 'Specchi da bagno all’ingrosso, con e senza cornice',
      heading: 'Specchi da bagno',
      intro:
        'Specchi da bagno con e senza cornice, senza luce integrata: forme tonde, ovali, ad arco e organiche, con cornice in legno, metallo o PS, su misura.',
    },
    'full-length-mirrors': {
      title: 'Specchi a figura intera su misura',
      heading: 'Specchi a figura intera',
      intro:
        'Specchi a figura intera da terra, da parete e da camera, cornice in legno massello, noce, metallo o PS, o senza cornice in forme organiche, su ordinazione.',
    },
    'mirror-cabinets': {
      title: 'Armadietti a specchio LED e da bagno per OEM',
      heading: 'Armadietti a specchio da bagno',
      intro:
        'Armadietti a specchio da bagno, con o senza luce LED: a due e tre ante, con ripiani a giorno o smart, in rovere, venatura noce e oro spazzolato.',
    },
  },
  de: {
    'led-mirrors': {
      title: 'LED-Badspiegel für Großhandel und OEM',
      heading: 'LED-Badspiegel',
      intro:
        'Hinterleuchtete, frontbeleuchtete und smarte LED-Spiegel, rund, oval, mit Bogen oder organisch geformt, mit Touch-Dimmer, Lichtfarbe und Antibeschlag.',
    },
    'bathroom-mirrors': {
      title: 'Badspiegel im Großhandel: mit und ohne Rahmen',
      heading: 'Badspiegel',
      intro:
        'Badspiegel mit und ohne Rahmen, ohne eingebautes Licht: rund, oval, mit Bogen oder organisch geformt, mit Holz-, Metall- oder PS-Rahmen, nach Maß.',
    },
    'full-length-mirrors': {
      title: 'Ganzkörper- und Ankleidespiegel nach Maß',
      heading: 'Ganzkörper- und Ankleidespiegel',
      intro:
        'Stand-, Wand- und Ankleidespiegel in voller Höhe, mit Rahmen aus Massivholz, Nussbaum, Metall oder PS oder rahmenlos in organischen Formen, auf Bestellung.',
    },
    'mirror-cabinets': {
      title: 'LED- und Bad-Spiegelschränke für OEM',
      heading: 'Spiegelschränke fürs Bad',
      intro:
        'Bad-Spiegelschränke mit oder ohne LED-Licht: zwei- und dreitürig, mit offenen Fächern oder smart, in Eiche, Nussbaum-Optik und gebürstetem Gold.',
    },
  },
  he: {
    'led-mirrors': {
      title: 'מראות אמבטיה LED לסיטונאות ול-OEM',
      heading: 'מראות אמבטיה LED',
      intro:
        'מראות LED עם תאורה אחורית, תאורה קדמית ומראות חכמות, בצורות עגולות, אובליות, קשתיות ואורגניות, עם עמעום במגע, גוון אור מתכוונן ונגד אדים.',
    },
    'bathroom-mirrors': {
      title: 'מראות אמבטיה בסיטונאות: עם מסגרת ובלי',
      heading: 'מראות אמבטיה',
      intro:
        'מראות אמבטיה עם מסגרת ובלי, ללא תאורה מובנית: צורות עגולות, אובליות, קשתיות ואורגניות, במסגרת עץ, מתכת או PS, במידות מותאמות.',
    },
    'full-length-mirrors': {
      title: 'מראות גוף מלא ומראות הלבשה בהתאמה אישית',
      heading: 'מראות גוף מלא ומראות הלבשה',
      intro:
        'מראות עומדות, תלויות ומראות הלבשה לגובה מלא, במסגרת עץ מלא, אגוז, מתכת או PS, או ללא מסגרת בצורות אורגניות, בייצור לפי הזמנה.',
    },
    'mirror-cabinets': {
      title: 'ארונות מראה LED ולאמבטיה ל-OEM',
      heading: 'ארונות מראה לאמבטיה',
      intro:
        'ארונות מראה לאמבטיה עם תאורת LED או בלעדיה: שתי דלתות או שלוש, מדפים פתוחים ודגמים חכמים, בגימור אלון, אגוז וזהב מוברש.',
    },
  },
};

/**
 * Landing copy for `slug` in `locale`, falling back to English for a locale
 * this file does not cover, and to null for a category it does not know.
 */
export function productCategoryCopy(locale: string, slug: string): ProductCategoryCopy | null {
  const safe = (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
  return CATEGORY_COPY[safe][slug] ?? CATEGORY_COPY[defaultLocale][slug] ?? null;
}
