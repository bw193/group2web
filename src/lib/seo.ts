import { locales, defaultLocale, type Locale } from '@/i18n/config';
import { localizedPath as buildLocalizedPath } from '@/lib/public-paths';
import { isIndexableLocalePath } from '@/lib/indexing';

export const SITE_URL = 'https://chengtaimirror.com';
export const SITE_NAME = 'Chengtai Mirror';
export const SITE_LEGAL_NAME = 'Jiaxing Chengtai Mirror Co., Ltd';
export const HEBREW_SITE_NAME = 'מראות Chengtai';
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

// Official brand profiles. Rendered in the footer and published as the
// Organization's `sameAs`, which is how search engines tie the site and the
// social accounts to one entity — so these must be the real, owned accounts,
// never a lookalike page. A profile with an empty URL is simply not rendered.
export const SOCIAL_PROFILES = [
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/chengtai_mirrors/' },
  {
    id: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/p/Jiaxing-Chengtai-Mirror-Co-Ltd-100065128945653/',
  },
] as const;

export const SOCIAL_SAME_AS = SOCIAL_PROFILES.filter((p) => p.url).map((p) => p.url);

// Topical scope of the business, for the shared #organization node. Kept in
// English across locales: these are domain terms used for entity resolution,
// not display copy.
//
// Two halves on purpose. The first states the company's role in the supply
// chain, which is how buyers search. Exact word-order permutations are left
// out - "LED Mirror OEM" carries no meaning "OEM LED Mirror" doesn't already
// carry, and permutation lists read as keyword stuffing. The second half
// states subject matter, so a model learns what the company knows about
// mirrors and not only what kind of vendor it is; every topic there is
// attested by the product specification data.
export const ORG_KNOWS_ABOUT = [
  'LED Mirror Manufacturer',
  'LED Mirror Supplier',
  'LED Mirror Factory',
  'Wholesale LED Mirror',
  'OEM LED Mirror',
  'Bathroom Mirror Manufacturer',
  'Bathroom Mirror Supplier',
  'Bathroom Mirror Factory',
  'Wholesale Bathroom Mirror',
  'OEM Bathroom Mirror',
  'Vanity Mirror Manufacturer',
  'Vanity Mirror Supplier',
  'Wholesale Vanity Mirror',
  'OEM Bathroom Vanity Mirror',
  'Mirror OEM',
  'Smart mirrors with touch and sensor controls',
  'Anti-fog mirror technology',
  'Backlit and front-lit mirror lighting',
  'Copper-free silver mirror glass',
  'Mirror cabinets',
  'Full-length and dressing mirrors',
];

// Certification schemes claimed on the public site. CE/CB/RoHS/SAA/UKCA/UL/RCM
// come from the product specification data; ETL and ISO 9001 come from the
// certifications marquee. IP44/IP54 are deliberately absent - they are ingress
// protection ratings on individual products, not company certifications, and
// they already ship as product-level specs. Removing a claim here means
// removing it from CertificationsSection too, or the two will disagree.
export const ORG_CERTIFICATIONS = [
  'CE',
  'CB',
  'RoHS',
  'SAA',
  'UKCA',
  'UL',
  'ETL',
  'RCM',
  'ISO 9001',
].map((name) => ({ '@type': 'Certification', name }));

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

export function localizedSiteName(locale: string): string {
  return locale === 'he' ? HEBREW_SITE_NAME : SITE_NAME;
}

/** Path with locale prefix. Mirrors middleware `localePrefix: 'always'`. */
export function localizedPath(locale: string, pathAfterLocale: string): string {
  return buildLocalizedPath(locale, pathAfterLocale);
}

/** Absolute URL for a localized path. */
export function localizedUrl(locale: string, pathAfterLocale: string): string {
  return `${SITE_URL}${localizedPath(locale, pathAfterLocale)}`;
}

/**
 * Build the hreflang languages map (incl. x-default → default locale).
 *
 * Locales whose page is noindex at this path are skipped — advertising a
 * noindexed URL as an alternate is a contradictory signal that Google drops.
 * In practice this removes `he` everywhere except the Hebrew homepage.
 */
export function buildLanguageAlternates(
  pathAfterLocale: string,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    if (!isIndexableLocalePath(loc, pathAfterLocale)) continue;
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
type PageKey = 'home' | 'products' | 'videos' | 'about' | 'contact' | 'insight';
type PageEntry = { title: string; description: string; h1?: string };
type RoutedCopy = Record<Exclude<PageKey, 'videos'>, PageEntry> & { videos?: PageEntry };

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
    videos: {
      title: 'LED Mirror Videos, Factory Tours & Installation Demos | Chengtai Mirror',
      description:
        'Watch Chengtai Mirror product demos, factory walkthroughs, installation clips, and quality-control videos for LED, smart, vanity, and bathroom mirrors.',
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
      title: 'מפעל מראות LED ואמבטיה בתקן CE/UL | מראות Chengtai',
      description:
        'מראות Chengtai — מפעל המתמחה במראות LED לאמבטיה, ארונות מראה ומראות גוף מלא. בעל תקני CE, ETL ו-RoHS לקמעונאות עולמית.',
      h1: 'יצרנית מראות LED מובילה בעולם',
    },
    products: {
      title: 'קטלוג מראות LED, חכמות ולאמבטיה | מראות Chengtai',
      description:
        'עיינו באוסף המלא של מראות LED, חכמות, נגד אדים ולאמבטיה של מראות Chengtai. סיטונאות, OEM/ODM ואריזה מוכנה לייצוא. בקשו הצעת מחיר.',
    },
    about: {
      title: 'אודות מראות Chengtai — מפעל מראות LED בג׳יאשינג',
      description:
        'נוסדה ב-2005 בג׳יאשינג, ז׳ג׳יאנג. מתקן בן 50,000 מ״ר, 200+ עובדים, 2,000,000 יחידות בשנה. תקני CE, CB, SAA, ETL, RoHS, ISO 9001 — משלוח ל-60+ מדינות.',
    },
    contact: {
      title: 'צרו קשר עם מראות Chengtai — בקשת הצעת מחיר',
      description:
        'שתפו את פרטי הפרויקט שלכם עם צוות הייצוא של מראות Chengtai. אנו משיבים תוך יום עסקים אחד. אימייל, וואטסאפ וטלפון ישיר זמינים.',
    },
    insight: {
      title: 'Insight — יומן עיצוב ורכש מראות LED | מראות Chengtai',
      description:
        'סיפורים ממפעל מראות פעיל: מגמות עיצוב מראות LED, אומנות הייצור, מקרי בוחן של פרויקטים ומדריכי רכש OEM/ODM לקונים גלובליים.',
    },
  },
};

const VIDEO_COPY: Record<Locale, PageEntry> = {
  en: COPY.en.videos!,
  es: {
    title: 'Vídeos de Espejos LED, Visitas a Fábrica y Demostraciones de Instalación | Chengtai Mirror',
    description:
      'Vea demostraciones de productos, recorridos por la fábrica, vídeos de instalación y controles de calidad de espejos LED, inteligentes, de tocador y de baño de Chengtai Mirror.',
  },
  pt: {
    title: 'Vídeos de Espelhos LED, Visitas à Fábrica e Demonstrações de Instalação | Chengtai Mirror',
    description:
      'Assista a demonstrações de produtos, visitas à fábrica, vídeos de instalação e controle de qualidade de espelhos LED, inteligentes, de penteadeira e de banheiro da Chengtai Mirror.',
  },
  fr: {
    title: 'Vidéos de Miroirs LED, Visites d’Usine et Démonstrations d’Installation | Chengtai Mirror',
    description:
      'Regardez les démonstrations de produits, visites d’usine, vidéos d’installation et contrôles qualité de Chengtai Mirror pour les miroirs LED, intelligents, de coiffeuse et de salle de bain.',
  },
  it: {
    title: 'Video di Specchi LED, Tour della Fabbrica e Demo di Installazione | Chengtai Mirror',
    description:
      'Guarda le demo dei prodotti, i tour della fabbrica, i video di installazione e i controlli qualità di Chengtai Mirror per specchi LED, smart, da toeletta e da bagno.',
  },
  de: {
    title: 'LED-Spiegel-Videos, Werksführungen & Installationsdemos | Chengtai Mirror',
    description:
      'Sehen Sie Produktdemos, Werksrundgänge, Installations- und Qualitätskontrollvideos von Chengtai Mirror für LED-, Smart-, Kosmetik- und Badspiegel.',
  },
  he: {
    title: 'סרטוני מראות LED, סיורים במפעל והדגמות התקנה | מראות Chengtai',
    description:
      'צפו בהדגמות מוצרים, סיורים במפעל, סרטוני התקנה ובקרת איכות של מראות Chengtai למראות LED, מראות חכמות, מראות איפור ומראות אמבטיה.',
  },
};

export function pageCopy(locale: string, key: PageKey) {
  const safe = (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
  if (key === 'videos') return VIDEO_COPY[safe];
  return COPY[safe][key] ?? COPY.en[key] ?? COPY.en.home;
}

/** "Product Name — Chengtai Mirror", localized when the page locale needs it. */
export function productTitle(name: string, locale: string = defaultLocale): string {
  return `${name} — ${localizedSiteName(locale)}`;
}
