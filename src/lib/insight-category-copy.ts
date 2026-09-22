import { defaultLocale, locales, type Locale } from '@/i18n/config';

/**
 * Landing copy for each Insight category page, in the same shape as the
 * `pageCopy` records in seo.ts: a heading that carries the search intent and
 * one intro sentence that doubles as the meta description (trimmed through
 * `snippet`, so keep it inside ~160 characters).
 *
 * The category name in the CMS is a one-word label — useful as a tab, too thin
 * to rank or to justify a landing page on its own. These pairs target the
 * sourcing intent the catalog is written for (manufacturer / supplier /
 * factory / wholesale / OEM, plus the hotel and commercial variants) so each
 * category page says something a buyer searched for.
 *
 * Keys match `articles.category`. A category with no entry here still works:
 * the page falls back to the CMS category name and the Insight description.
 */
export interface InsightCategoryCopy {
  heading: string;
  intro: string;
}

const CATEGORY_COPY: Record<Locale, Record<string, InsightCategoryCopy>> = {
  en: {
    craft: {
      heading: 'How a bathroom mirror is made',
      intro:
        'Inside the glass: copper-free silvering, edge work and the tolerances a bathroom mirror manufacturer holds before a panel earns its box.',
    },
    design: {
      heading: 'LED mirror design',
      intro:
        'Shapes, light temperature and frame finishes from a custom LED mirror manufacturer — what hotels, retail and residential fit-outs specify.',
    },
    manufacturing: {
      heading: 'Inside an LED mirror factory',
      intro:
        'Production lines, quality gates and capacity at our 48,000 m² LED mirror factory in Jiaxing: how wholesale orders are built, tested and packed.',
    },
    projects: {
      heading: 'Hotel and commercial mirror projects',
      intro:
        'Specification notes from hotel and commercial fit-outs: what a project bathroom mirror supplier is asked for, and how bulk orders are scheduled.',
    },
    sourcing: {
      heading: 'Sourcing LED and bathroom mirrors',
      intro:
        'Briefs, samples, MOQs, lead times and certificates — what buyers ask an OEM LED mirror manufacturer before the first container leaves Jiaxing.',
    },
    technology: {
      heading: 'Smart mirror technology',
      intro:
        'Anti-fog heating, touch and sensor controls, dimming and IP ratings, explained by the factory that builds them into LED bathroom mirrors.',
    },
    news: {
      heading: 'Factory news',
      intro:
        'Trade shows, certifications and capacity news from Chengtai Mirror, an LED and bathroom mirror manufacturer in Jiaxing, China.',
    },
  },
  es: {
    craft: {
      heading: 'Cómo se fabrica un espejo de baño',
      intro:
        'Dentro del vidrio: plateado sin cobre, canteado y las tolerancias que cumple un fabricante de espejos de baño antes de embalar un panel.',
    },
    design: {
      heading: 'Diseño de espejos LED',
      intro:
        'Formas, temperatura de luz y acabados de marco desde un fabricante de espejos LED a medida: lo que se especifica en hoteles, retail y vivienda.',
    },
    manufacturing: {
      heading: 'Dentro de una fábrica de espejos LED',
      intro:
        'Líneas de producción, controles de calidad y capacidad en nuestra fábrica de 48.000 m² en Jiaxing: cómo se fabrican y embalan los pedidos mayoristas.',
    },
    projects: {
      heading: 'Proyectos de hotel y espacios comerciales',
      intro:
        'Notas de especificación de proyectos hoteleros y comerciales: qué se pide a un proveedor de espejos de baño y cómo se planifican los grandes pedidos.',
    },
    sourcing: {
      heading: 'Abastecimiento de espejos LED y de baño',
      intro:
        'Briefs, muestras, MOQ, plazos y certificados: lo que preguntan los compradores a un fabricante OEM de espejos LED antes del primer contenedor.',
    },
    technology: {
      heading: 'Tecnología de espejos inteligentes',
      intro:
        'Desempañado, control táctil y por sensor, regulación e índices IP, explicados por la fábrica que los integra en espejos LED de baño.',
    },
    news: {
      heading: 'Noticias de la fábrica',
      intro:
        'Ferias, certificaciones y capacidad productiva: novedades de Chengtai Mirror, fabricante de espejos LED y de baño en Jiaxing, China.',
    },
  },
  pt: {
    craft: {
      heading: 'Como se fabrica um espelho de banheiro',
      intro:
        'Dentro do vidro: prateamento sem cobre, lapidação e as tolerâncias que um fabricante de espelhos de banheiro cumpre antes de embalar.',
    },
    design: {
      heading: 'Design de espelhos LED',
      intro:
        'Formas, temperatura de luz e acabamentos de moldura de um fabricante de espelhos LED personalizados: o que hotéis, varejo e residências especificam.',
    },
    manufacturing: {
      heading: 'Dentro de uma fábrica de espelhos LED',
      intro:
        'Linhas de produção, controles de qualidade e capacidade na nossa fábrica de 48.000 m² em Jiaxing: como pedidos no atacado são feitos e embalados.',
    },
    projects: {
      heading: 'Projetos de hotelaria e espaços comerciais',
      intro:
        'Notas de especificação de projetos hoteleiros e comerciais: o que se pede a um fornecedor de espelhos de banheiro e como grandes pedidos são programados.',
    },
    sourcing: {
      heading: 'Compra de espelhos LED e de banheiro',
      intro:
        'Briefings, amostras, MOQ, prazos e certificados: o que os compradores perguntam a um fabricante OEM de espelhos LED antes do primeiro contêiner.',
    },
    technology: {
      heading: 'Tecnologia de espelhos inteligentes',
      intro:
        'Antiembaçante, controle por toque e sensor, dimerização e graus IP, explicados pela fábrica que os integra em espelhos LED de banheiro.',
    },
    news: {
      heading: 'Notícias da fábrica',
      intro:
        'Feiras, certificações e capacidade produtiva: novidades da Chengtai Mirror, fabricante de espelhos LED e de banheiro em Jiaxing, China.',
    },
  },
  fr: {
    craft: {
      heading: 'Comment naît un miroir de salle de bains',
      intro:
        'Dans le verre : argenture sans cuivre, travail des chants et tolérances qu’un fabricant de miroirs de salle de bains tient avant l’emballage.',
    },
    design: {
      heading: 'Design de miroirs LED',
      intro:
        'Formes, température de lumière et finitions de cadre par un fabricant de miroirs LED sur mesure : ce que prescrivent l’hôtellerie et le résidentiel.',
    },
    manufacturing: {
      heading: 'Dans une usine de miroirs LED',
      intro:
        'Lignes de production, contrôles qualité et capacité dans notre usine de 48 000 m² à Jiaxing : comment les commandes en gros sont fabriquées et emballées.',
    },
    projects: {
      heading: 'Projets hôteliers et tertiaires',
      intro:
        'Notes de prescription en hôtellerie et tertiaire : ce qu’on demande à un fournisseur de miroirs de salle de bains et comment les volumes sont planifiés.',
    },
    sourcing: {
      heading: 'Sourcing de miroirs LED et de salle de bains',
      intro:
        'Cahiers des charges, échantillons, MOQ, délais et certificats : ce que les acheteurs demandent à un fabricant OEM de miroirs LED avant de commander.',
    },
    technology: {
      heading: 'Technologie des miroirs connectés',
      intro:
        'Antibuée, commandes tactiles et capteurs, gradation et indices IP, expliqués par l’usine qui les intègre aux miroirs LED de salle de bains.',
    },
    news: {
      heading: 'Actualités de l’usine',
      intro:
        'Salons, certifications et capacités de production : les actualités de Chengtai Mirror, fabricant de miroirs LED et de salle de bains à Jiaxing, en Chine.',
    },
  },
  it: {
    craft: {
      heading: 'Come nasce uno specchio da bagno',
      intro:
        'Dentro il vetro: argentatura senza rame, lavorazione dei bordi e le tolleranze che un produttore di specchi da bagno rispetta prima dell’imballo.',
    },
    design: {
      heading: 'Design di specchi LED',
      intro:
        'Forme, temperatura della luce e finiture della cornice da un produttore di specchi LED su misura: cosa specificano hotel, retail e residenziale.',
    },
    manufacturing: {
      heading: 'Dentro una fabbrica di specchi LED',
      intro:
        'Linee di produzione, controlli qualità e capacità nel nostro stabilimento di 48.000 m² a Jiaxing: come nascono e si imballano gli ordini all’ingrosso.',
    },
    projects: {
      heading: 'Progetti alberghieri e commerciali',
      intro:
        'Note di specifica da progetti alberghieri e commerciali: cosa si chiede a un fornitore di specchi da bagno e come si pianificano i grandi ordini.',
    },
    sourcing: {
      heading: 'Acquistare specchi LED e da bagno',
      intro:
        'Brief, campioni, MOQ, tempi di consegna e certificati: cosa chiedono i buyer a un produttore OEM di specchi LED prima del primo container.',
    },
    technology: {
      heading: 'Tecnologia degli specchi smart',
      intro:
        'Antiappannamento, comandi touch e sensori, dimmerazione e grado IP, spiegati dalla fabbrica che li integra negli specchi LED da bagno.',
    },
    news: {
      heading: 'Notizie dalla fabbrica',
      intro:
        'Fiere, certificazioni e capacità produttiva: le notizie di Chengtai Mirror, produttore di specchi LED e da bagno a Jiaxing, in Cina.',
    },
  },
  de: {
    craft: {
      heading: 'Wie ein Badspiegel entsteht',
      intro:
        'Im Glas: kupferfreie Versilberung, Kantenbearbeitung und die Toleranzen, die ein Badspiegel-Hersteller einhält, bevor eine Platte verpackt wird.',
    },
    design: {
      heading: 'LED-Spiegel-Design',
      intro:
        'Formen, Lichtfarben und Rahmenoberflächen von einem Hersteller individueller LED-Spiegel: was Hotellerie, Handel und Wohnbau ausschreiben.',
    },
    manufacturing: {
      heading: 'In einer LED-Spiegel-Fabrik',
      intro:
        'Produktionslinien, Qualitätsprüfungen und Kapazität in unserem 48.000 m² großen Werk in Jiaxing: wie Großhandelsaufträge entstehen und verpackt werden.',
    },
    projects: {
      heading: 'Hotel- und Objektprojekte',
      intro:
        'Ausschreibungsnotizen aus Hotel- und Objektprojekten: was ein Badspiegel-Lieferant leisten muss und wie große Aufträge geplant werden.',
    },
    sourcing: {
      heading: 'LED- und Badspiegel beschaffen',
      intro:
        'Briefings, Muster, MOQ, Lieferzeiten und Zertifikate: was Einkäufer einen OEM-LED-Spiegel-Hersteller vor dem ersten Container fragen.',
    },
    technology: {
      heading: 'Technik smarter Spiegel',
      intro:
        'Spiegelheizung, Touch- und Sensorsteuerung, Dimmung und IP-Schutzarten, erklärt von der Fabrik, die sie in LED-Badspiegel einbaut.',
    },
    news: {
      heading: 'Neues aus dem Werk',
      intro:
        'Messen, Zertifizierungen und Kapazitäten: Neuigkeiten von Chengtai Mirror, Hersteller von LED- und Badspiegeln in Jiaxing, China.',
    },
  },
  he: {
    craft: {
      heading: 'איך נוצרת מראת אמבטיה',
      intro:
        'בתוך הזכוכית: ציפוי כסף נטול נחושת, עיבוד קצוות והסבילות שיצרן מראות אמבטיה עומד בה לפני האריזה.',
    },
    design: {
      heading: 'עיצוב מראות LED',
      intro:
        'צורות, גווני אור וגימורי מסגרת מיצרן מראות LED בהתאמה אישית — מה נדרש בפרויקטי מלונאות, קמעונאות ומגורים.',
    },
    manufacturing: {
      heading: 'בתוך מפעל מראות LED',
      intro:
        'קווי ייצור, בקרות איכות וקיבולת במפעל שלנו בשטח 48,000 מ״ר בג׳יאשינג — כך נבנות, נבדקות ונארזות הזמנות סיטונאיות.',
    },
    projects: {
      heading: 'פרויקטי מלונאות ומסחר',
      intro:
        'הערות מפרט מפרויקטי מלונאות ומסחר: מה מבקשים מספק מראות אמבטיה וכיצד מתוזמנות הזמנות בהיקפים גדולים.',
    },
    sourcing: {
      heading: 'רכש מראות LED ומראות אמבטיה',
      intro:
        'מפרטים, דוגמאות, כמות מינימלית, זמני אספקה ותקנים — מה קונים שואלים יצרן OEM של מראות LED לפני המכולה הראשונה.',
    },
    technology: {
      heading: 'טכנולוגיית מראות חכמות',
      intro:
        'חימום נגד אדים, בקרת מגע וחיישנים, עמעום ודירוגי IP — בהסבר המפעל שמשלב אותם במראות LED לאמבטיה.',
    },
    news: {
      heading: 'חדשות מהמפעל',
      intro:
        'תערוכות, תקנים וקיבולת ייצור: חדשות Chengtai Mirror, יצרנית מראות LED ומראות אמבטיה בג׳יאשינג, סין.',
    },
  },
};

/**
 * Landing copy for `key`, or null when the category is newer than this file —
 * in which case the page uses the CMS category name and the Insight
 * description, exactly as it would have before these pages existed.
 */
export function insightCategoryCopy(locale: string, key: string): InsightCategoryCopy | null {
  const safe = (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
  return CATEGORY_COPY[safe][key] ?? CATEGORY_COPY[defaultLocale][key] ?? null;
}
