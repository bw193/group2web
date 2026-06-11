import { locales, defaultLocale, type Locale } from '@/i18n/config';

export const SITE_URL = 'https://chengtaimirror.com';
export const SITE_NAME = 'Chengtai Mirror';
export const SITE_LEGAL_NAME = 'Jiaxing Chengtai Mirror Co., Ltd';
export const SITE_LOGO_URL =
  'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/assets/Favicon.png';
// Dedicated 1200x630 brand/product collage image used for og:image and
// twitter:image on non-product pages. Upload the actual artwork to this
// Supabase Storage path; do NOT reuse the favicon (search engines and
// social platforms expect a real preview image, not a square logo).
export const SITE_OG_IMAGE =
  'https://yleuaykcrrrqdhzmrmoq.supabase.co/storage/v1/object/public/assets/og-image.jpg';

export const CONTACT_EMAIL = 'bolen5@cnjxctm.com';
export const CONTACT_PHONE = '+86-178-6056-7239';
export const ADDRESS = {
  streetAddress: 'No. 768 Xinda Road, Xinfeng Town, Nanhu District',
  addressLocality: 'Jiaxing',
  addressRegion: 'Zhejiang',
  postalCode: '314005',
  addressCountry: 'CN',
};

const LOCALE_TO_BCP47: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
  pt: 'pt_BR',
  fr: 'fr_FR',
  it: 'it_IT',
  de: 'de_DE',
  he: 'he_IL',
};

export function localeToOg(locale: string): string {
  return LOCALE_TO_BCP47[locale as Locale] ?? 'en_US';
}

/** Path with locale prefix. Mirrors middleware `localePrefix: 'always'`. */
export function localizedPath(locale: string, pathAfterLocale: string): string {
  return `/${locale}${pathAfterLocale}`;
}

/** Absolute URL for a localized path. */
export function localizedUrl(locale: string, pathAfterLocale: string): string {
  return `${SITE_URL}${localizedPath(locale, pathAfterLocale)}`;
}

/** Build the hreflang languages map (incl. x-default → default locale). */
export function buildLanguageAlternates(
  pathAfterLocale: string,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = localizedUrl(loc, pathAfterLocale);
  }
  languages['x-default'] = localizedUrl(defaultLocale, pathAfterLocale);
  return languages;
}

/** Build `alternates` for Next Metadata: canonical + per-locale languages. */
export function buildAlternates(locale: string, pathAfterLocale: string) {
  return {
    canonical: localizedUrl(locale, pathAfterLocale),
    languages: buildLanguageAlternates(pathAfterLocale),
  };
}

/**
 * Per-page SEO copy keyed by locale. Kept here (not in messages JSON) so
 * SERP-targeted phrasing can be tuned independently of in-page UI copy.
 * Falls back to English if a locale entry is missing.
 */
type PageKey = 'home' | 'products' | 'about' | 'contact' | 'insight';
type PageEntry = { title: string; description: string; h1?: string };
type RoutedCopy = Record<PageKey, PageEntry>;

const COPY: Record<Locale, RoutedCopy> = {
  en: {
    home: {
      title: 'CE/UL Certified LED & Bathroom Mirror Factory | Chengtai Mirror',
      description:
        'Chengtai Mirror — specialized factory for premium LED bathroom mirrors, mirror cabinets & full-length mirrors. CE, ETL & RoHS certified for global retail.',
      h1: 'Leading Global LED Mirror Manufacturer',
    },
    products: {
      title: 'LED, Smart & Bathroom Mirror Catalog | Chengtai Mirror',
      description:
        "Browse Chengtai Mirror's full collection of LED, smart, anti-fog, and bathroom mirrors. Wholesale, OEM/ODM, export-ready packaging. Request a quote.",
    },
    about: {
      title: 'About Chengtai Mirror — Jiaxing LED Mirror Factory',
      description:
        'Founded 2005 in Jiaxing, Zhejiang. 50,000 sqm facility, 200+ staff, 2,000,000 units/year. CE, CB, SAA, ETL, RoHS, ISO 9001 — shipping to 60+ countries.',
    },
    contact: {
      title: 'Contact Chengtai Mirror — Request a Quote',
      description:
        "Share your project details with Chengtai Mirror's export team. We reply within one business day. Email, WhatsApp, and direct phone available.",
    },
    insight: {
      title: 'LED Mirror Insights | Factory Notes from Chengtai Mirror',
      description:
        'Explore LED mirror design, manufacturing, quality control, certifications, and sourcing tips from Chengtai Mirror, a professional LED mirror factory.',
    },
  },
  es: {
    home: {
      title: 'Fábrica de Espejos LED y de Baño Certificada CE/UL | Chengtai Mirror',
      description:
        'Chengtai Mirror — fábrica especializada en espejos LED de baño, armarios con espejo y espejos de cuerpo entero. Certificados CE, ETL y RoHS para la distribución global.',
      h1: 'Fabricante Líder Mundial de Espejos LED',
    },
    products: {
      title: 'Catálogo de Espejos LED, Smart y Baño | Chengtai Mirror',
      description:
        'Explore la colección completa de espejos LED, inteligentes, antiniebla y de baño de Chengtai Mirror. Mayorista, OEM/ODM, embalaje listo para exportación. Solicite cotización.',
    },
    about: {
      title: 'Sobre Chengtai Mirror — Fábrica en Jiaxing, China',
      description:
        'Fundada en 2005 en Jiaxing, Zhejiang. Planta de 50.000 m², más de 200 empleados, 2.000.000 unidades/año. Espejos certificados CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO 9001 enviados a más de 60 países.',
    },
    contact: {
      title: 'Contactar Chengtai Mirror — Solicitar Cotización',
      description:
        'Comparta los detalles de su proyecto con el equipo de exportación de Chengtai Mirror. Respondemos en un día hábil. Correo, WhatsApp y teléfono directo disponibles.',
    },
    insight: {
      title: 'Insight — Diario de Diseño y Compra de Espejos LED | Chengtai Mirror',
      description:
        'Historias desde una fábrica de espejos en activo: tendencias de diseño de espejos LED, artesanía de fabricación, proyectos reales y guías de compra OEM/ODM.',
    },
  },
  pt: {
    home: {
      title: 'Fábrica de Espelhos LED e de Banheiro Certificada CE/UL | Chengtai Mirror',
      description:
        'Chengtai Mirror — fábrica especializada em espelhos LED de banheiro, espelheiras e espelhos de corpo inteiro. Certificados CE, ETL e RoHS para o varejo global.',
      h1: 'Fabricante Líder Mundial de Espelhos LED',
    },
    products: {
      title: 'Catálogo de Espelhos LED, Smart e de Banho | Chengtai Mirror',
      description:
        'Explore a coleção completa de espelhos LED, inteligentes, antiembaçantes e de banho da Chengtai Mirror. Atacado, OEM/ODM, embalagem pronta para exportação. Solicite orçamento.',
    },
    about: {
      title: 'Sobre a Chengtai Mirror — Fábrica em Jiaxing',
      description:
        'Fundada em 2005 em Jiaxing, Zhejiang. Instalação de 50.000 m², mais de 200 funcionários, 2.000.000 unidades/ano. Espelhos certificados CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO 9001 enviados para mais de 60 países.',
    },
    contact: {
      title: 'Contato Chengtai Mirror — Solicitar Orçamento',
      description:
        'Compartilhe os detalhes do seu projeto com a equipe de exportação da Chengtai Mirror. Respondemos em um dia útil. E-mail, WhatsApp e telefone direto disponíveis.',
    },
    insight: {
      title: 'Insight — Jornal de Design e Sourcing de Espelhos LED | Chengtai Mirror',
      description:
        'Histórias de uma fábrica de espelhos em atividade: tendências de design de espelhos LED, artesanato de fabricação, estudos de projetos e guias de sourcing OEM/ODM.',
    },
  },
  fr: {
    home: {
      title: 'Usine de Miroirs LED et de Salle de Bain Certifiée CE/UL | Chengtai Mirror',
      description:
        'Chengtai Mirror — usine spécialisée en miroirs LED de salle de bain, armoires de toilette et miroirs sur pied. Certifiés CE, ETL et RoHS pour la distribution mondiale.',
      h1: 'Fabricant Leader Mondial de Miroirs LED',
    },
    products: {
      title: 'Catalogue de Miroirs LED, Intelligents et de Salle de Bain | Chengtai Mirror',
      description:
        "Découvrez la collection complète de miroirs LED, intelligents, antibuée et de salle de bain de Chengtai Mirror. Vente en gros, OEM/ODM, emballage prêt à l'export. Demandez un devis.",
    },
    about: {
      title: 'À Propos de Chengtai Mirror — Usine à Jiaxing',
      description:
        "Fondée en 2005 à Jiaxing, Zhejiang. Site de 50 000 m², plus de 200 employés, capacité de 2 000 000 unités/an. Miroirs certifiés CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO 9001 expédiés dans plus de 60 pays.",
    },
    contact: {
      title: 'Contacter Chengtai Mirror — Demander un Devis',
      description:
        "Partagez les détails de votre projet avec l'équipe d'export de Chengtai Mirror. Réponse sous un jour ouvré. E-mail, WhatsApp et téléphone direct disponibles.",
    },
    insight: {
      title: 'Insight — Journal du Design et du Sourcing de Miroirs LED | Chengtai Mirror',
      description:
        "Histoires d'une usine de miroirs en activité : tendances du design de miroirs LED, savoir-faire de fabrication, études de projets et guides de sourcing OEM/ODM.",
    },
  },
  it: {
    home: {
      title: 'Fabbrica di Specchi LED e da Bagno Certificata CE/UL | Chengtai Mirror',
      description:
        'Chengtai Mirror — fabbrica specializzata in specchi LED da bagno, specchi contenitore e specchi a figura intera. Certificati CE, ETL e RoHS per la distribuzione globale.',
      h1: 'Produttore Leader Mondiale di Specchi LED',
    },
    products: {
      title: 'Catalogo Specchi LED, Smart e da Bagno | Chengtai Mirror',
      description:
        "Esplora la collezione completa di specchi LED, smart, antiappannamento e da bagno di Chengtai Mirror. Ingrosso, OEM/ODM, imballaggio pronto per l'export. Richiedi preventivo.",
    },
    about: {
      title: 'Chi è Chengtai Mirror — Stabilimento a Jiaxing',
      description:
        'Fondata nel 2005 a Jiaxing, Zhejiang. Stabilimento di 50.000 mq, oltre 200 dipendenti, 2.000.000 unità/anno. Specchi certificati CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO 9001 spediti in oltre 60 paesi.',
    },
    contact: {
      title: 'Contatta Chengtai Mirror — Richiedi un Preventivo',
      description:
        "Condividi i dettagli del tuo progetto con il team export di Chengtai Mirror. Rispondiamo entro un giorno lavorativo. Email, WhatsApp e telefono diretto disponibili.",
    },
    insight: {
      title: 'Insight — Giornale di Design e Sourcing di Specchi LED | Chengtai Mirror',
      description:
        'Storie da una fabbrica di specchi in attività: tendenze del design di specchi LED, artigianato produttivo, casi studio di progetti e guide al sourcing OEM/ODM.',
    },
  },
  de: {
    home: {
      title: 'CE/UL-zertifizierte LED- & Badspiegel-Fabrik | Chengtai Mirror',
      description:
        'Chengtai Mirror — spezialisierte Fabrik für hochwertige LED-Badspiegel, Spiegelschränke und Ganzkörperspiegel. CE-, ETL- und RoHS-zertifiziert für den weltweiten Handel.',
      h1: 'Weltweit Führender LED-Spiegel-Hersteller',
    },
    products: {
      title: 'LED-, Smart- & Badspiegel Katalog | Chengtai Mirror',
      description:
        'Durchstöbern Sie die komplette Kollektion an LED-, Smart-, Antibeschlag- und Badspiegeln von Chengtai Mirror. Großhandel, OEM/ODM, exportfertige Verpackung. Angebot anfordern.',
    },
    about: {
      title: 'Über Chengtai Mirror — Spiegelfabrik in Jiaxing',
      description:
        'Gegründet 2005 in Jiaxing, Zhejiang. 50.000 m² Werk, über 200 Mitarbeiter, Jahreskapazität 2.000.000 Einheiten. CE-, CB-, SAA-, ETL-, IP44-, IP54-, RoHS- und ISO-9001-zertifizierte Spiegel — Lieferung in 60+ Länder.',
    },
    contact: {
      title: 'Chengtai Mirror Kontakt — Angebot Anfordern',
      description:
        'Teilen Sie Ihre Projektdetails mit dem Exportteam von Chengtai Mirror. Wir antworten innerhalb eines Werktags. E-Mail, WhatsApp und Direkttelefon verfügbar.',
    },
    insight: {
      title: 'Insight — Journal für LED-Spiegel-Design & Beschaffung | Chengtai Mirror',
      description:
        'Geschichten aus einer aktiven Spiegelfabrik: LED-Spiegel-Designtrends, Fertigungshandwerk, Projektberichte und OEM/ODM-Beschaffungsleitfäden für globale Einkäufer.',
    },
  },
  he: {
    home: {
      title: 'מפעל מראות LED ואמבטיה בתקן CE/UL | Chengtai Mirror',
      description:
        'Chengtai Mirror — מפעל המתמחה במראות LED לאמבטיה, ארונות מראה ומראות גוף מלא. בעל תקני CE, ETL ו-RoHS לקמעונאות עולמית.',
      h1: 'יצרנית מראות LED מובילה בעולם',
    },
    products: {
      title: 'קטלוג מראות LED, חכמות ולאמבטיה | Chengtai Mirror',
      description:
        'עיינו באוסף המלא של מראות LED, חכמות, נגד אדים ולאמבטיה של Chengtai Mirror. סיטונאות, OEM/ODM ואריזה מוכנה לייצוא. בקשו הצעת מחיר.',
    },
    about: {
      title: 'אודות Chengtai Mirror — מפעל מראות LED בג׳יאשינג',
      description:
        'נוסדה ב-2005 בג׳יאשינג, ז׳ג׳יאנג. מתקן בן 50,000 מ״ר, 200+ עובדים, 2,000,000 יחידות בשנה. תקני CE, CB, SAA, ETL, RoHS, ISO 9001 — משלוח ל-60+ מדינות.',
    },
    contact: {
      title: 'צרו קשר עם Chengtai Mirror — בקשת הצעת מחיר',
      description:
        'שתפו את פרטי הפרויקט שלכם עם צוות הייצוא של Chengtai Mirror. אנו משיבים תוך יום עסקים אחד. אימייל, וואטסאפ וטלפון ישיר זמינים.',
    },
    insight: {
      title: 'Insight — יומן עיצוב ורכש מראות LED | Chengtai Mirror',
      description:
        'סיפורים ממפעל מראות פעיל: מגמות עיצוב מראות LED, אומנות הייצור, מקרי בוחן של פרויקטים ומדריכי רכש OEM/ODM לקונים גלובליים.',
    },
  },
};

export function pageCopy(locale: string, key: PageKey) {
  const safe = (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
  return COPY[safe][key];
}

/** "Product Name — Chengtai Mirror" */
export function productTitle(name: string): string {
  return `${name} — ${SITE_NAME}`;
}
