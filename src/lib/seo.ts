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
type PageKey = 'home' | 'products' | 'about' | 'contact';
type PageEntry = { title: string; description: string; h1?: string };
type RoutedCopy = Record<PageKey, PageEntry>;

const COPY: Record<Locale, RoutedCopy> = {
  en: {
    home: {
      title: 'Chengtai Mirror — LED, Smart & Bathroom Mirror Manufacturer',
      description:
        'Chengtai Mirror — 21 years manufacturing LED, smart & bathroom mirrors for hospitality, retail, and residential projects worldwide. OEM/ODM, CE/ETL certified.',
      h1: 'LED, Smart & Bathroom Mirror Manufacturer',
    },
    products: {
      title: 'LED, Smart & Bathroom Mirror Catalog | Chengtai Mirror',
      description:
        "Browse Chengtai Mirror's full collection of LED, smart, anti-fog, and bathroom mirrors. Wholesale, OEM/ODM, export-ready packaging. Request a quote.",
    },
    about: {
      title: 'About Chengtai Mirror — 35,000 sqm Factory in Jiaxing, China',
      description:
        'Founded 2005 in Jiaxing, Zhejiang. 35,000 sqm facility, 200+ staff, 500,000 units/year. CE, CB, SAA, ETL, RoHS, ISO 9001 — shipping to 60+ countries.',
    },
    contact: {
      title: 'Contact Chengtai Mirror — Request a Quote',
      description:
        "Share your project details with Chengtai Mirror's export team. We reply within one business day. Email, WhatsApp, and direct phone available.",
    },
  },
  es: {
    home: {
      title: 'Chengtai Mirror — Fabricante de Espejos LED, Smart y Baño',
      description:
        'Jiaxing Chengtai Mirror — 21 años fabricando espejos LED, inteligentes y de baño para proyectos hoteleros, retail y residenciales globales. OEM/ODM, certificados CE/CB/SAA/ETL/RoHS/ISO 9001.',
      h1: 'Fabricante de Espejos LED, Smart y Baño',
    },
    products: {
      title: 'Catálogo de Espejos LED, Smart y Baño | Chengtai Mirror',
      description:
        'Explore la colección completa de espejos LED, inteligentes, antiniebla y de baño de Chengtai Mirror. Mayorista, OEM/ODM, embalaje listo para exportación. Solicite cotización.',
    },
    about: {
      title: 'Sobre Chengtai Mirror — Fábrica de 35.000 m² en Jiaxing, China',
      description:
        'Fundada en 2005 en Jiaxing, Zhejiang. Planta de 35.000 m², más de 200 empleados, 500.000 unidades/año. Espejos certificados CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO 9001 enviados a más de 60 países.',
    },
    contact: {
      title: 'Contactar Chengtai Mirror — Solicitar Cotización',
      description:
        'Comparta los detalles de su proyecto con el equipo de exportación de Chengtai Mirror. Respondemos en un día hábil. Correo, WhatsApp y teléfono directo disponibles.',
    },
  },
  pt: {
    home: {
      title: 'Chengtai Mirror — Fabricante de Espelhos LED, Smart e de Banho',
      description:
        'Jiaxing Chengtai Mirror — 21 anos fabricando espelhos LED, inteligentes e de banho para projetos hoteleiros, varejo e residenciais globais. OEM/ODM, certificados CE/CB/SAA/ETL/RoHS/ISO 9001.',
      h1: 'Fabricante de Espelhos LED, Smart e de Banho',
    },
    products: {
      title: 'Catálogo de Espelhos LED, Smart e de Banho | Chengtai Mirror',
      description:
        'Explore a coleção completa de espelhos LED, inteligentes, antiembaçantes e de banho da Chengtai Mirror. Atacado, OEM/ODM, embalagem pronta para exportação. Solicite orçamento.',
    },
    about: {
      title: 'Sobre a Chengtai Mirror — Fábrica de 35.000 m² em Jiaxing, China',
      description:
        'Fundada em 2005 em Jiaxing, Zhejiang. Instalação de 35.000 m², mais de 200 funcionários, 500.000 unidades/ano. Espelhos certificados CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO 9001 enviados para mais de 60 países.',
    },
    contact: {
      title: 'Contato Chengtai Mirror — Solicitar Orçamento',
      description:
        'Compartilhe os detalhes do seu projeto com a equipe de exportação da Chengtai Mirror. Respondemos em um dia útil. E-mail, WhatsApp e telefone direto disponíveis.',
    },
  },
  fr: {
    home: {
      title: 'Chengtai Mirror — Fabricant de Miroirs LED, Intelligents et de Salle de Bain',
      description:
        "Jiaxing Chengtai Mirror — 21 ans de fabrication de miroirs LED, intelligents et de salle de bain pour les projets hôteliers, retail et résidentiels mondiaux. OEM/ODM, certifiés CE/CB/SAA/ETL/RoHS/ISO 9001.",
      h1: 'Fabricant de Miroirs LED, Intelligents et de Salle de Bain',
    },
    products: {
      title: 'Catalogue de Miroirs LED, Intelligents et de Salle de Bain | Chengtai Mirror',
      description:
        "Découvrez la collection complète de miroirs LED, intelligents, antibuée et de salle de bain de Chengtai Mirror. Vente en gros, OEM/ODM, emballage prêt à l'export. Demandez un devis.",
    },
    about: {
      title: 'À Propos de Chengtai Mirror — Usine de 35 000 m² à Jiaxing, Chine',
      description:
        "Fondée en 2005 à Jiaxing, Zhejiang. Site de 35 000 m², plus de 200 employés, capacité de 500 000 unités/an. Miroirs certifiés CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO 9001 expédiés dans plus de 60 pays.",
    },
    contact: {
      title: 'Contacter Chengtai Mirror — Demander un Devis',
      description:
        "Partagez les détails de votre projet avec l'équipe d'export de Chengtai Mirror. Réponse sous un jour ouvré. E-mail, WhatsApp et téléphone direct disponibles.",
    },
  },
  it: {
    home: {
      title: 'Chengtai Mirror — Produttore di Specchi LED, Smart e da Bagno',
      description:
        "Jiaxing Chengtai Mirror — 21 anni di produzione di specchi LED, smart e da bagno per progetti hospitality, retail e residenziali globali. OEM/ODM, certificati CE/CB/SAA/ETL/RoHS/ISO 9001.",
      h1: 'Produttore di Specchi LED, Smart e da Bagno',
    },
    products: {
      title: 'Catalogo Specchi LED, Smart e da Bagno | Chengtai Mirror',
      description:
        "Esplora la collezione completa di specchi LED, smart, antiappannamento e da bagno di Chengtai Mirror. Ingrosso, OEM/ODM, imballaggio pronto per l'export. Richiedi preventivo.",
    },
    about: {
      title: 'Chi è Chengtai Mirror — Stabilimento di 35.000 mq a Jiaxing, Cina',
      description:
        'Fondata nel 2005 a Jiaxing, Zhejiang. Stabilimento di 35.000 mq, oltre 200 dipendenti, 500.000 unità/anno. Specchi certificati CE, CB, SAA, ETL, IP44, IP54, RoHS, ISO 9001 spediti in oltre 60 paesi.',
    },
    contact: {
      title: 'Contatta Chengtai Mirror — Richiedi un Preventivo',
      description:
        "Condividi i dettagli del tuo progetto con il team export di Chengtai Mirror. Rispondiamo entro un giorno lavorativo. Email, WhatsApp e telefono diretto disponibili.",
    },
  },
  de: {
    home: {
      title: 'Chengtai Mirror — Hersteller von LED-, Smart- & Badspiegeln',
      description:
        'Jiaxing Chengtai Mirror — 21 Jahre Erfahrung in der Fertigung von LED-, Smart- und Badspiegeln für globale Hotellerie-, Retail- und Wohnprojekte. OEM/ODM, CE/CB/SAA/ETL/RoHS/ISO 9001 zertifiziert.',
      h1: 'Hersteller von LED-, Smart- & Badspiegeln',
    },
    products: {
      title: 'LED-, Smart- & Badspiegel Katalog | Chengtai Mirror',
      description:
        'Durchstöbern Sie die komplette Kollektion an LED-, Smart-, Antibeschlag- und Badspiegeln von Chengtai Mirror. Großhandel, OEM/ODM, exportfertige Verpackung. Angebot anfordern.',
    },
    about: {
      title: 'Über Chengtai Mirror — 35.000 m² Spiegelfabrik in Jiaxing, China',
      description:
        'Gegründet 2005 in Jiaxing, Zhejiang. 35.000 m² Werk, über 200 Mitarbeiter, Jahreskapazität 500.000 Einheiten. CE-, CB-, SAA-, ETL-, IP44-, IP54-, RoHS- und ISO-9001-zertifizierte Spiegel — Lieferung in 60+ Länder.',
    },
    contact: {
      title: 'Chengtai Mirror Kontakt — Angebot Anfordern',
      description:
        'Teilen Sie Ihre Projektdetails mit dem Exportteam von Chengtai Mirror. Wir antworten innerhalb eines Werktags. E-Mail, WhatsApp und Direkttelefon verfügbar.',
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
