import { defaultLocale, locales, type Locale } from '@/i18n/config';

/**
 * Landing copy for the Insight category pages (/insight/<category>), in the
 * spirit of the `pageCopy` records in seo.ts.
 *
 * - `title`   the <title>, led by the search terms in keywords.md
 *             (manufacturer / supplier / wholesale / OEM / China, hotel and
 *             commercial). titleWithSiteName appends the brand when it fits.
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
      title: 'LED Mirror Manufacturing in China: Supply Chain & Scale',
      heading: 'LED mirror manufacturing in China',
      intro:
        'Why China leads LED mirror manufacturing — supply chains, scale and materials engineering — and what that means for buyers sourcing from a factory.',
    },
    technology: {
      title: 'LED Mirror Installation & Maintenance Guides',
      heading: 'Installing and caring for LED mirrors',
      intro:
        "Step-by-step LED mirror installation, and the maintenance mistakes that shorten a mirror's life — practical guides from the factory that builds them.",
    },
    news: {
      title: 'Chengtai Mirror News: Trade Shows & Company Updates',
      heading: 'News from the factory',
      intro:
        'Trade shows, exhibitions and company updates from Chengtai Mirror, an LED and bathroom mirror manufacturer in Jiaxing, China.',
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
      title: 'Fabricación de espejos LED en China: suministro y escala',
      heading: 'Fabricación de espejos LED en China',
      intro:
        'Por qué China lidera la fabricación de espejos LED —cadena de suministro, escala e ingeniería de materiales— y qué implica para quien compra en fábrica.',
    },
    technology: {
      title: 'Instalación y mantenimiento de espejos LED',
      heading: 'Instalar y cuidar los espejos LED',
      intro:
        'Instalación de espejos LED paso a paso y los errores de mantenimiento que acortan su vida útil: guías prácticas de la fábrica que los produce.',
    },
    news: {
      title: 'Noticias de Chengtai Mirror: ferias y novedades',
      heading: 'Noticias de la fábrica',
      intro:
        'Ferias, exposiciones y novedades de Chengtai Mirror, fabricante de espejos LED y de baño en Jiaxing, China.',
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
      title: 'Fabricação de espelhos LED na China: cadeia e escala',
      heading: 'Fabricação de espelhos LED na China',
      intro:
        'Por que a China lidera a fabricação de espelhos LED — cadeia de suprimentos, escala e engenharia de materiais — e o que isso significa para o comprador.',
    },
    technology: {
      title: 'Instalação e manutenção de espelhos LED',
      heading: 'Instalar e cuidar de espelhos LED',
      intro:
        'Instalação de espelhos LED passo a passo e os erros de manutenção que encurtam a vida útil: guias práticos da fábrica que os produz.',
    },
    news: {
      title: 'Notícias da Chengtai Mirror: feiras e novidades',
      heading: 'Notícias da fábrica',
      intro:
        'Feiras, exposições e novidades da Chengtai Mirror, fabricante de espelhos LED e de banheiro em Jiaxing, China.',
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
      title: 'Fabrication de miroirs LED en Chine : filière et échelle',
      heading: 'Fabriquer des miroirs LED en Chine',
      intro:
        'Pourquoi la Chine domine la fabrication de miroirs LED — filière, échelle, ingénierie des matériaux — et ce que cela change pour l’acheteur.',
    },
    technology: {
      title: 'Installation et entretien des miroirs LED',
      heading: 'Installer et entretenir un miroir LED',
      intro:
        'L’installation d’un miroir LED pas à pas et les erreurs d’entretien qui réduisent sa durée de vie : guides pratiques de l’usine qui les fabrique.',
    },
    news: {
      title: 'Actualités de Chengtai Mirror : salons et nouvelles',
      heading: 'Actualités de l’usine',
      intro:
        'Salons, expositions et actualités de Chengtai Mirror, fabricant de miroirs LED et de salle de bains à Jiaxing, en Chine.',
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
      title: 'Produzione di specchi LED in Cina: filiera e scala',
      heading: 'Produrre specchi LED in Cina',
      intro:
        'Perché la Cina guida la produzione di specchi LED — filiera, scala e ingegneria dei materiali — e cosa significa per chi acquista in fabbrica.',
    },
    technology: {
      title: 'Installazione e manutenzione degli specchi LED',
      heading: 'Installare e curare gli specchi LED',
      intro:
        'Installare uno specchio LED passo dopo passo e gli errori di manutenzione che ne accorciano la vita: guide pratiche dalla fabbrica che li produce.',
    },
    news: {
      title: 'Notizie da Chengtai Mirror: fiere e novità',
      heading: 'Notizie dalla fabbrica',
      intro:
        'Fiere, esposizioni e novità di Chengtai Mirror, produttore di specchi LED e da bagno a Jiaxing, in Cina.',
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
      title: 'LED-Spiegel-Fertigung in China: Lieferkette und Größe',
      heading: 'LED-Spiegel-Fertigung in China',
      intro:
        'Warum China die LED-Spiegel-Fertigung anführt – Lieferketten, Skalierung, Werkstofftechnik – und was das für Einkäufer direkt ab Werk bedeutet.',
    },
    technology: {
      title: 'LED-Spiegel montieren und pflegen: Ratgeber',
      heading: 'LED-Spiegel montieren und pflegen',
      intro:
        'LED-Spiegel Schritt für Schritt montieren – und die Pflegefehler, die ihre Lebensdauer verkürzen: Praxisratgeber aus dem Werk, das sie baut.',
    },
    news: {
      title: 'Chengtai Mirror aktuell: Messen und Neuigkeiten',
      heading: 'Aktuelles aus dem Werk',
      intro:
        'Messen, Ausstellungen und Neuigkeiten von Chengtai Mirror, Hersteller von LED- und Badspiegeln in Jiaxing, China.',
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
      title: 'ייצור מראות LED בסין: שרשרת אספקה והיקף',
      heading: 'ייצור מראות LED בסין',
      intro:
        'למה סין מובילה את ייצור מראות ה-LED — שרשרת אספקה, היקף והנדסת חומרים — ומה זה אומר לקונים שרוכשים ישירות מהמפעל.',
    },
    technology: {
      title: 'התקנה ותחזוקה של מראות LED',
      heading: 'התקנה ותחזוקה של מראות LED',
      intro:
        'התקנת מראת LED צעד אחר צעד, וטעויות התחזוקה שמקצרות את חייה — מדריכים מעשיים מהמפעל שמייצר אותן.',
    },
    news: {
      title: 'חדשות Chengtai Mirror: תערוכות ועדכונים',
      heading: 'חדשות מהמפעל',
      intro:
        'תערוכות, ירידים ועדכונים מ-Chengtai Mirror, יצרנית מראות LED ומראות אמבטיה בג׳יאשינג, סין.',
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
