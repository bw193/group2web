import { defaultLocale, locales, type Locale } from '@/i18n/config';

/**
 * Landing copy for the Insight category pages (/insight/<category>), in the
 * spirit of the `pageCopy` records in seo.ts.
 *
 * - `title`   the <title>, led by the search terms in keywords.md
 *             (manufacturer / supplier / wholesale / OEM, hotel and commercial).
 *             titleWithSiteName appends the brand when it fits.
 * - `heading` the H1: editorial, shorter than the title.
 * - `intro`   one sentence under the H1 that is also the meta description, so
 *             it stays inside snippet()'s 155 characters (tests hold every
 *             locale to that).
 *
 * Each entry describes what the category actually publishes — e.g.
 * "technology" holds an installation guide and a maintenance piece, so its
 * page says so rather than promising anti-fog and sensor deep-dives.
 * Keys match `articles.category`. A category added in the CMS later still gets
 * a working page: it falls back to its CMS name and the Insight description.
 */
export interface InsightCategoryCopy {
  title: string;
  heading: string;
  intro: string;
}

const CATEGORY_COPY: Record<Locale, Record<string, InsightCategoryCopy>> = {
  en: {
    sourcing: {
      title: 'LED Mirror Sourcing Guides for Wholesale & OEM Buyers',
      heading: 'Sourcing LED and bathroom mirrors',
      intro:
        'How to compare LED mirror manufacturers, vet a bathroom mirror supplier, and specify glass and IP ratings for wholesale and hotel orders.',
    },
    design: {
      title: 'LED Mirror Design: Custom Shapes, Light & Features',
      heading: 'LED mirror design',
      intro:
        'Arched and custom shapes, colour temperature and CRI, and the features now built into LED mirrors — design notes for hotel and residential projects.',
    },
    craft: {
      title: 'How Mirrors Are Made: Silvering, Coating & Edge Work',
      heading: 'How a mirror is made',
      intro:
        'From float glass to finished mirror: the silvering and protective coats of our coating line, and the polished edges we still set by hand.',
    },
    manufacturing: {
      title: 'LED Mirror Manufacturing: Supply Chain, Scale & Materials',
      heading: 'Inside LED mirror manufacturing',
      intro:
        'What goes into making LED mirrors at volume — supply chains, economies of scale and materials engineering — and what it means for wholesale buyers.',
    },
    technology: {
      title: 'LED Mirror Installation & Maintenance Guides',
      heading: 'Installing and caring for LED mirrors',
      intro:
        "Step-by-step LED mirror installation, and the maintenance mistakes that shorten a mirror's life — practical guides from the factory that builds them.",
    },
    news: {
      title: 'Company News & Trade Shows',
      heading: 'News and events',
      intro:
        'Trade shows we exhibit at, the products we bring to them, and other news from the company.',
    },
    projects: {
      title: 'Hotel & Commercial Bathroom Mirror Projects',
      heading: 'Hotel and commercial projects',
      intro:
        'Case notes from hotel and commercial fit-outs: how a project bathroom mirror supplier specifies, samples and delivers LED mirrors at volume.',
    },
  },
  es: {
    sourcing: {
      title: 'Guías de compra de espejos LED para mayoristas y OEM',
      heading: 'Abastecimiento de espejos LED y de baño',
      intro:
        'Cómo comparar fabricantes de espejos LED, evaluar a un proveedor de espejos de baño y especificar vidrio e IP para pedidos mayoristas y hoteleros.',
    },
    design: {
      title: 'Diseño de espejos LED: formas, luz y funciones',
      heading: 'Diseño de espejos LED',
      intro:
        'Formas arqueadas y a medida, temperatura de color y CRI, y las funciones que ya integran los espejos LED: notas de diseño para hoteles y viviendas.',
    },
    craft: {
      title: 'Cómo se fabrica un espejo: plateado, recubrimiento y cantos',
      heading: 'Cómo se fabrica un espejo',
      intro:
        'Del vidrio float al espejo terminado: el plateado y las capas protectoras de nuestra línea de recubrimiento, y los cantos que aún pulimos a mano.',
    },
    manufacturing: {
      title: 'Fabricación de espejos LED: suministro, escala y materiales',
      heading: 'Dentro de la fabricación de espejos LED',
      intro:
        'Qué implica fabricar espejos LED en volumen —cadena de suministro, economías de escala e ingeniería de materiales— y qué significa para el mayorista.',
    },
    technology: {
      title: 'Instalación y mantenimiento de espejos LED',
      heading: 'Instalar y cuidar los espejos LED',
      intro:
        'Instalación de espejos LED paso a paso y los errores de mantenimiento que acortan su vida útil: guías prácticas de la fábrica que los produce.',
    },
    news: {
      title: 'Noticias de la empresa y ferias',
      heading: 'Noticias y eventos',
      intro:
        'Las ferias en las que exponemos, los productos que llevamos a ellas y otras novedades de la empresa.',
    },
    projects: {
      title: 'Proyectos de espejos de baño para hoteles y comercios',
      heading: 'Proyectos hoteleros y comerciales',
      intro:
        'Notas de proyectos hoteleros y comerciales: cómo un proveedor de espejos de baño especifica, muestrea y entrega espejos LED en volumen.',
    },
  },
  pt: {
    sourcing: {
      title: 'Guias de compra de espelhos LED para atacado e OEM',
      heading: 'Compra de espelhos LED e de banheiro',
      intro:
        'Como comparar fabricantes de espelhos LED, avaliar um fornecedor de espelhos de banheiro e especificar vidro e IP para pedidos de atacado e hotelaria.',
    },
    design: {
      title: 'Design de espelhos LED: formatos, luz e funções',
      heading: 'Design de espelhos LED',
      intro:
        'Formatos em arco e sob medida, temperatura de cor e IRC, e as funções já integradas aos espelhos LED: notas de design para hotéis e residências.',
    },
    craft: {
      title: 'Como se fabrica um espelho: prateação, revestimento e bordas',
      heading: 'Como se fabrica um espelho',
      intro:
        'Do vidro float ao espelho pronto: a prateação e as camadas protetoras da nossa linha de revestimento, e as bordas que ainda polimos à mão.',
    },
    manufacturing: {
      title: 'Fabricação de espelhos LED: suprimentos, escala e materiais',
      heading: 'Por dentro da fabricação de espelhos LED',
      intro:
        'O que envolve fabricar espelhos LED em volume — cadeia de suprimentos, economia de escala e engenharia de materiais — e o que muda para o atacadista.',
    },
    technology: {
      title: 'Instalação e manutenção de espelhos LED',
      heading: 'Instalar e cuidar de espelhos LED',
      intro:
        'Instalação de espelhos LED passo a passo e os erros de manutenção que encurtam a vida útil: guias práticos da fábrica que os produz.',
    },
    news: {
      title: 'Notícias da empresa e feiras',
      heading: 'Notícias e eventos',
      intro:
        'As feiras em que expomos, os produtos que levamos a elas e outras novidades da empresa.',
    },
    projects: {
      title: 'Projetos de espelhos de banheiro para hotéis e comércio',
      heading: 'Projetos hoteleiros e comerciais',
      intro:
        'Notas de projetos hoteleiros e comerciais: como um fornecedor de espelhos de banheiro especifica, amostra e entrega espelhos LED em volume.',
    },
  },
  fr: {
    sourcing: {
      title: 'Guides d’achat de miroirs LED pour grossistes et OEM',
      heading: 'Sourcing de miroirs LED et de salle de bains',
      intro:
        'Comparer les fabricants de miroirs LED, évaluer un fournisseur de miroirs de salle de bains, spécifier verre et IP pour le gros et l’hôtellerie.',
    },
    design: {
      title: 'Design de miroirs LED : formes, lumière et fonctions',
      heading: 'Design de miroirs LED',
      intro:
        'Formes cintrées et sur mesure, température de couleur et IRC, fonctions intégrées aux miroirs LED : notes de design pour l’hôtellerie et l’habitat.',
    },
    craft: {
      title: 'Comment naît un miroir : argenture, vernis et chants',
      heading: 'Comment naît un miroir',
      intro:
        'Du verre float au miroir fini : l’argenture et les couches protectrices de notre ligne de revêtement, et les chants encore polis à la main.',
    },
    manufacturing: {
      title: 'Fabrication de miroirs LED : filière, échelle et matériaux',
      heading: 'Au cœur de la fabrication des miroirs LED',
      intro:
        'Ce qu’exige la fabrication de miroirs LED en volume — filière, économies d’échelle, ingénierie des matériaux — et ce que cela change pour le grossiste.',
    },
    technology: {
      title: 'Installation et entretien des miroirs LED',
      heading: 'Installer et entretenir un miroir LED',
      intro:
        'L’installation d’un miroir LED pas à pas et les erreurs d’entretien qui réduisent sa durée de vie : guides pratiques de l’usine qui les fabrique.',
    },
    news: {
      title: 'Actualités de l’entreprise et salons',
      heading: 'Actualités et événements',
      intro:
        'Les salons où nous exposons, les produits que nous y présentons et les autres nouvelles de l’entreprise.',
    },
    projects: {
      title: 'Projets de miroirs de salle de bains pour l’hôtellerie',
      heading: 'Projets hôteliers et tertiaires',
      intro:
        'Notes de projets hôteliers et tertiaires : comment un fournisseur de miroirs de salle de bains prescrit, échantillonne et livre en volume.',
    },
  },
  it: {
    sourcing: {
      title: 'Guide all’acquisto di specchi LED per ingrosso e OEM',
      heading: 'Acquistare specchi LED e da bagno',
      intro:
        'Come confrontare i produttori di specchi LED, valutare un fornitore di specchi da bagno e specificare vetro e IP per ordini all’ingrosso e alberghieri.',
    },
    design: {
      title: 'Design di specchi LED: forme, luce e funzioni',
      heading: 'Design di specchi LED',
      intro:
        'Forme ad arco e su misura, temperatura di colore e CRI, e le funzioni ormai integrate negli specchi LED: note di design per hotel e residenze.',
    },
    craft: {
      title: 'Come nasce uno specchio: argentatura, vernici e bordi',
      heading: 'Come nasce uno specchio',
      intro:
        'Dal vetro float allo specchio finito: l’argentatura e gli strati protettivi della nostra linea di rivestimento, e i bordi che levighiamo ancora a mano.',
    },
    manufacturing: {
      title: 'Produzione di specchi LED: filiera, scala e materiali',
      heading: 'Dentro la produzione di specchi LED',
      intro:
        'Cosa serve per produrre specchi LED in volume — filiera, economie di scala e ingegneria dei materiali — e cosa significa per chi compra all’ingrosso.',
    },
    technology: {
      title: 'Installazione e manutenzione degli specchi LED',
      heading: 'Installare e curare gli specchi LED',
      intro:
        'Installare uno specchio LED passo dopo passo e gli errori di manutenzione che ne accorciano la vita: guide pratiche dalla fabbrica che li produce.',
    },
    news: {
      title: 'Notizie aziendali e fiere',
      heading: 'Notizie ed eventi',
      intro:
        'Le fiere a cui partecipiamo, i prodotti che vi portiamo e le altre novità dell’azienda.',
    },
    projects: {
      title: 'Progetti di specchi da bagno per hotel e spazi commerciali',
      heading: 'Progetti alberghieri e commerciali',
      intro:
        'Note da progetti alberghieri e commerciali: come un fornitore di specchi da bagno specifica, campiona e consegna specchi LED in volume.',
    },
  },
  de: {
    sourcing: {
      title: 'Einkaufsratgeber für LED-Spiegel: Großhandel und OEM',
      heading: 'LED- und Badspiegel beschaffen',
      intro:
        'LED-Spiegel-Hersteller vergleichen, einen Badspiegel-Lieferanten prüfen, Glas und IP-Schutzart festlegen – für Großhandel und Hotelprojekte.',
    },
    design: {
      title: 'LED-Spiegel-Design: Formen, Licht und Funktionen',
      heading: 'LED-Spiegel-Design',
      intro:
        'Bogen- und Sonderformen, Farbtemperatur und CRI und die Funktionen, die LED-Spiegel heute mitbringen – Designnotizen für Hotel- und Wohnprojekte.',
    },
    craft: {
      title: 'Wie ein Spiegel entsteht: Versilberung, Lack und Kanten',
      heading: 'Wie ein Spiegel entsteht',
      intro:
        'Vom Floatglas zum fertigen Spiegel: Versilberung und Schutzlacke auf unserer Beschichtungslinie – und Kanten, die wir noch von Hand polieren.',
    },
    manufacturing: {
      title: 'LED-Spiegel-Fertigung: Lieferkette, Größe und Werkstoffe',
      heading: 'Einblick in die LED-Spiegel-Fertigung',
      intro:
        'Was es braucht, um LED-Spiegel in Stückzahl zu fertigen – Lieferkette, Skaleneffekte, Werkstofftechnik – und was das für Großhändler bedeutet.',
    },
    technology: {
      title: 'LED-Spiegel montieren und pflegen: Ratgeber',
      heading: 'LED-Spiegel montieren und pflegen',
      intro:
        'LED-Spiegel Schritt für Schritt montieren – und die Pflegefehler, die ihre Lebensdauer verkürzen: Praxisratgeber aus dem Werk, das sie baut.',
    },
    news: {
      title: 'Neuigkeiten aus dem Unternehmen und Messen',
      heading: 'Aktuelles und Termine',
      intro:
        'Die Messen, auf denen wir ausstellen, was wir dort zeigen, und weitere Neuigkeiten aus dem Unternehmen.',
    },
    projects: {
      title: 'Badspiegel für Hotel- und Objektprojekte',
      heading: 'Hotel- und Objektprojekte',
      intro:
        'Notizen aus Hotel- und Objektprojekten: wie ein Badspiegel-Lieferant LED-Spiegel spezifiziert, bemustert und in Stückzahl liefert.',
    },
  },
  he: {
    sourcing: {
      title: 'מדריכי רכש מראות LED לסיטונאים ול-OEM',
      heading: 'רכש מראות LED ומראות אמבטיה',
      intro:
        'איך להשוות יצרני מראות LED, לבדוק ספק מראות אמבטיה ולהגדיר זכוכית ודירוג IP להזמנות סיטונאיות ולפרויקטי מלונאות.',
    },
    design: {
      title: 'עיצוב מראות LED: צורות, תאורה ופונקציות',
      heading: 'עיצוב מראות LED',
      intro:
        'צורות קשת ומידות מותאמות, טמפרטורת צבע ו-CRI, והפונקציות שכבר משולבות במראות LED — הערות עיצוב לפרויקטי מלונאות ומגורים.',
    },
    craft: {
      title: 'איך נוצרת מראה: הכספה, ציפוי ושוליים',
      heading: 'איך נוצרת מראה',
      intro:
        'מזכוכית פלואט למראה מוגמרת: ההכספה ושכבות ההגנה בקו הציפוי שלנו, והשוליים שאנו עדיין מלטשים ביד.',
    },
    manufacturing: {
      title: 'ייצור מראות LED: שרשרת אספקה, היקף וחומרים',
      heading: 'מאחורי הקלעים של ייצור מראות LED',
      intro:
        'מה נדרש כדי לייצר מראות LED בהיקפים גדולים — שרשרת אספקה, יתרונות לגודל והנדסת חומרים — ומה זה אומר לקונים סיטונאיים.',
    },
    technology: {
      title: 'התקנה ותחזוקה של מראות LED',
      heading: 'התקנה ותחזוקה של מראות LED',
      intro:
        'התקנת מראת LED צעד אחר צעד, וטעויות התחזוקה שמקצרות את חייה — מדריכים מעשיים מהמפעל שמייצר אותן.',
    },
    news: {
      title: 'חדשות החברה ותערוכות',
      heading: 'חדשות ואירועים',
      intro:
        'התערוכות שבהן אנו מציגים, המוצרים שאנו מביאים אליהן ועדכונים נוספים מהחברה.',
    },
    projects: {
      title: 'פרויקטי מראות אמבטיה למלונות ולמסחר',
      heading: 'פרויקטי מלונאות ומסחר',
      intro:
        'הערות מפרויקטי מלונאות ומסחר: כיצד ספק מראות אמבטיה מגדיר, מספק דוגמאות ומייצר מראות LED בהיקפים גדולים.',
    },
  },
};

/**
 * Landing copy for `key` in `locale`, falling back to English for a locale
 * this file does not cover, and to null for a category it does not know.
 */
export function insightCategoryCopy(locale: string, key: string): InsightCategoryCopy | null {
  const safe = (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
  return CATEGORY_COPY[safe][key] ?? CATEGORY_COPY[defaultLocale][key] ?? null;
}
