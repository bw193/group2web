import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n/config';
import { buildAlternates, localizedSiteName } from '@/lib/seo';

// Content of the Privacy Policy and Legal Notice (Impressum), linked from the
// footer on every page. The privacy text describes what the site actually
// does: Vercel hosting, the inquiry form (database on Supabase, notification
// email through Resend), Google Analytics 4 linked to Google Ads, Vercel Web
// Analytics and Speed Insights, embedded YouTube players and files served
// from Supabase storage. Change it whenever one of those changes.

export type LegalPageKey = 'privacy' | 'legalNotice';

/** Generic path after the locale; localizedPath adds the Hebrew rewrite. */
export const LEGAL_PAGE_PATHS: Record<LegalPageKey, string> = {
  privacy: '/privacy',
  legalNotice: '/legal-notice',
};

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  eyebrow: string;
  title: string;
  description: string;
  updated?: string;
  intro?: string;
  sections: LegalSection[];
}

export const COMPANY_LEGAL = {
  name: 'Jiaxing Chengtai Mirror Co., Ltd',
  address: 'No. 768 Xinda Road, Xinfeng Town, Nanhu District, Jiaxing, Zhejiang, China',
  email: 'inquiry@chengtaimirror.com',
  phone: '+86 178 6056 7239',
  // From the business licence. Null until the company supplies them; a null
  // field is left off the Legal Notice rather than shown blank.
  legalRepresentative: null as string | null,
  unifiedSocialCreditCode: null as string | null,
};

const HOST = 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA';
const GA_OPT_OUT = 'https://tools.google.com/dlpage/gaoptout';

const { name: C_NAME, address: C_ADDRESS, email: C_EMAIL, phone: C_PHONE } = COMPANY_LEGAL;

/** "Label: value" lines for the licence fields that have been filled in. */
function licenceLines(representativeLabel: string, registrationLabel: string): string[] {
  const lines: string[] = [];
  if (COMPANY_LEGAL.legalRepresentative) {
    lines.push(`${representativeLabel}: ${COMPANY_LEGAL.legalRepresentative}`);
  }
  if (COMPANY_LEGAL.unifiedSocialCreditCode) {
    lines.push(`${registrationLabel}: ${COMPANY_LEGAL.unifiedSocialCreditCode}`);
  }
  return lines;
}

const DOCUMENTS: Record<string, Record<LegalPageKey, LegalDocument>> = {
  en: {
    privacy: {
      eyebrow: 'Legal',
      title: 'Privacy Policy',
      description: `How ${C_NAME} collects and uses personal data on chengtaimirror.com.`,
      updated: 'Last updated: 28 October 2026',
      intro: `This policy explains what personal data chengtaimirror.com collects, why we use it, and the choices you have. It describes only what the site actually does.`,
      sections: [
        {
          heading: 'Who is responsible',
          paragraphs: [
            `${C_NAME}, ${C_ADDRESS}. Email: ${C_EMAIL}.`,
            `For any question about your personal data, write to us at this address.`,
          ],
        },
        {
          heading: 'When you browse the site',
          paragraphs: [
            `The site is hosted by Vercel Inc. (USA). Like any web server, it records technical data for each request: your IP address, the date and time, the page requested, your browser and operating system, and the page you came from. We use this data only to deliver the site, keep it secure and fix errors (Article 6(1)(f) GDPR).`,
            `The site itself sets no cookies.`,
          ],
        },
        {
          heading: 'When you send us an inquiry',
          paragraphs: [
            `The inquiry form asks for your name, email address and message, and optionally your phone number, company, country and the product you are interested in. We use this information to answer you and to prepare quotations (Article 6(1)(b) GDPR).`,
            `Your inquiry is stored in our database, hosted by Supabase Inc., and forwarded to our sales team by email through the email service Resend.`,
            `We keep inquiries for as long as we need them to handle your request and any business relationship that follows, and we delete them when you ask us to.`,
          ],
        },
        {
          heading: 'When you email us or use WhatsApp',
          paragraphs: [
            `If you email us or message us on WhatsApp, we use your contact details and your message to reply. WhatsApp is operated by Meta; its own privacy policy applies to messages sent through it.`,
          ],
        },
        {
          heading: 'Google Analytics',
          paragraphs: [
            `We use Google Analytics 4, a service of Google Ireland Limited and Google LLC, to understand how visitors use the site: which pages are viewed and for how long, from which type of device and approximate location, and how visitors found us. Google Analytics sets cookies (_ga and _ga_C201XKXR1X) and, according to Google, does not log or store IP addresses. Our analytics data is linked to our Google Ads account so we can measure our advertising.`,
            `We do this because we have a legitimate interest in understanding and improving our website and advertising (Article 6(1)(f) GDPR). You can block these cookies in your browser settings or install Google's opt-out browser add-on at ${GA_OPT_OUT}.`,
          ],
        },
        {
          heading: 'Vercel Web Analytics and Speed Insights',
          paragraphs: [
            `We also use Vercel Web Analytics and Vercel Speed Insights. They count page views and measure how fast pages load, without cookies and without identifying individual visitors.`,
          ],
        },
        {
          heading: 'YouTube videos',
          paragraphs: [
            `Our video pages embed videos from YouTube, a Google service. When a video player loads, YouTube receives your IP address and may set cookies, under Google's privacy policy. Video preview images are also loaded from YouTube's servers.`,
          ],
        },
        {
          heading: 'Photos and documents',
          paragraphs: [
            `Product photos, documents and other files are delivered from the storage servers of Supabase Inc., which receive your IP address when your browser loads them.`,
          ],
        },
        {
          heading: 'Links to other websites',
          paragraphs: [
            `We link to our profiles on Instagram, Facebook and other websites. These are plain links: nothing is sent to those websites unless you click them, and their own privacy policies then apply.`,
          ],
        },
        {
          heading: 'Where your data is processed',
          paragraphs: [
            `Our company is based in China, and our service providers process data in the United States, the European Union and other countries. Your data may therefore be processed outside your own country.`,
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            `Depending on where you live, you may ask us for access to the personal data we hold about you, and ask us to correct it, delete it, restrict or stop its use, or send it to you in a portable format. You also have the right to complain to a data protection authority. To make a request, email ${C_EMAIL}.`,
          ],
        },
        {
          heading: 'Changes to this policy',
          paragraphs: [
            `We update this policy when the website changes. The date at the top shows when it was last revised.`,
          ],
        },
      ],
    },
    legalNotice: {
      eyebrow: 'Legal',
      title: 'Legal Notice',
      description: `Company information and legal notes for chengtaimirror.com.`,
      sections: [
        {
          heading: 'Website operator',
          paragraphs: [C_NAME, C_ADDRESS, ...licenceLines('Legal representative', 'Unified Social Credit Code')],
        },
        { heading: 'Contact', paragraphs: [`Email: ${C_EMAIL}`, `Phone and WhatsApp: ${C_PHONE}`] },
        { heading: 'Hosting', paragraphs: [`This website is hosted by ${HOST}.`] },
        {
          heading: 'Responsibility for content',
          paragraphs: [
            `We prepare the content of this website with care, but we cannot guarantee that every detail is complete, correct and up to date. Product specifications may change; please confirm them with our sales team before you order.`,
          ],
        },
        {
          heading: 'Links',
          paragraphs: [
            `Links to other websites are provided for convenience. The operators of those websites are responsible for their content.`,
          ],
        },
        {
          heading: 'Copyright',
          paragraphs: [
            `Texts, photos and videos on this website belong to ${C_NAME} unless stated otherwise. Please ask us before reusing them.`,
          ],
        },
      ],
    },
  },

  de: {
    privacy: {
      eyebrow: 'Rechtliches',
      title: 'Datenschutzerklärung',
      description: `Wie die ${C_NAME} personenbezogene Daten auf chengtaimirror.com erhebt und verwendet.`,
      updated: 'Stand: 28. Oktober 2026',
      intro: `Diese Erklärung beschreibt, welche personenbezogenen Daten chengtaimirror.com erhebt, wozu wir sie verwenden und welche Wahlmöglichkeiten Sie haben. Sie beschreibt nur, was die Website tatsächlich tut.`,
      sections: [
        {
          heading: 'Verantwortlicher',
          paragraphs: [
            `${C_NAME}, ${C_ADDRESS}. E-Mail: ${C_EMAIL}.`,
            `Bei Fragen zu Ihren personenbezogenen Daten schreiben Sie uns bitte an diese Adresse.`,
          ],
        },
        {
          heading: 'Beim Besuch der Website',
          paragraphs: [
            `Die Website wird von der Vercel Inc. (USA) gehostet. Wie jeder Webserver erfasst sie bei jedem Abruf technische Daten: Ihre IP-Adresse, Datum und Uhrzeit, die aufgerufene Seite, Browser und Betriebssystem sowie die Seite, von der Sie kamen. Diese Daten nutzen wir nur, um die Website bereitzustellen, sie zu schützen und Fehler zu beheben (Art. 6 Abs. 1 lit. f DSGVO).`,
            `Die Website selbst setzt keine Cookies.`,
          ],
        },
        {
          heading: 'Wenn Sie uns eine Anfrage senden',
          paragraphs: [
            `Das Anfrageformular fragt nach Ihrem Namen, Ihrer E-Mail-Adresse und Ihrer Nachricht sowie optional nach Telefonnummer, Unternehmen, Land und dem Produkt, für das Sie sich interessieren. Wir verwenden diese Angaben, um Ihnen zu antworten und Angebote zu erstellen (Art. 6 Abs. 1 lit. b DSGVO).`,
            `Ihre Anfrage wird in unserer Datenbank gespeichert, die von der Supabase Inc. gehostet wird, und über den E-Mail-Dienst Resend an unser Vertriebsteam weitergeleitet.`,
            `Wir bewahren Anfragen so lange auf, wie wir sie für die Bearbeitung Ihres Anliegens und eine daraus entstehende Geschäftsbeziehung benötigen, und löschen sie auf Ihren Wunsch.`,
          ],
        },
        {
          heading: 'Wenn Sie uns per E-Mail oder WhatsApp schreiben',
          paragraphs: [
            `Wenn Sie uns eine E-Mail oder eine WhatsApp-Nachricht senden, verwenden wir Ihre Kontaktdaten und Ihre Nachricht, um Ihnen zu antworten. WhatsApp wird von Meta betrieben; für Nachrichten über WhatsApp gilt dessen eigene Datenschutzerklärung.`,
          ],
        },
        {
          heading: 'Google Analytics',
          paragraphs: [
            `Wir nutzen Google Analytics 4, einen Dienst der Google Ireland Limited und der Google LLC, um zu verstehen, wie Besucher die Website nutzen: welche Seiten wie lange aufgerufen werden, mit welchem Gerätetyp und aus welcher ungefähren Region, und wie Besucher uns gefunden haben. Google Analytics setzt Cookies (_ga und _ga_C201XKXR1X) und protokolliert oder speichert nach Angaben von Google keine IP-Adressen. Unsere Analysedaten sind mit unserem Google-Ads-Konto verknüpft, damit wir unsere Werbung auswerten können.`,
            `Wir tun dies, weil wir ein berechtigtes Interesse daran haben, unsere Website und unsere Werbung zu verstehen und zu verbessern (Art. 6 Abs. 1 lit. f DSGVO). Sie können diese Cookies in Ihren Browsereinstellungen blockieren oder das Deaktivierungs-Add-on von Google unter ${GA_OPT_OUT} installieren.`,
          ],
        },
        {
          heading: 'Vercel Web Analytics und Speed Insights',
          paragraphs: [
            `Außerdem nutzen wir Vercel Web Analytics und Vercel Speed Insights. Sie zählen Seitenaufrufe und messen Ladezeiten, ohne Cookies und ohne einzelne Besucher zu identifizieren.`,
          ],
        },
        {
          heading: 'YouTube-Videos',
          paragraphs: [
            `Unsere Videoseiten binden Videos von YouTube ein, einem Dienst von Google. Sobald ein Videoplayer geladen wird, erhält YouTube Ihre IP-Adresse und kann gemäß der Datenschutzerklärung von Google Cookies setzen. Auch die Vorschaubilder der Videos werden von Servern von YouTube geladen.`,
          ],
        },
        {
          heading: 'Fotos und Dokumente',
          paragraphs: [
            `Produktfotos, Dokumente und andere Dateien werden von den Speicherservern der Supabase Inc. ausgeliefert, die beim Laden Ihre IP-Adresse erhalten.`,
          ],
        },
        {
          heading: 'Links zu anderen Websites',
          paragraphs: [
            `Wir verlinken auf unsere Profile bei Instagram, Facebook und anderen Websites. Es handelt sich um einfache Links: An diese Websites wird nichts übermittelt, solange Sie die Links nicht anklicken; danach gelten deren eigene Datenschutzerklärungen.`,
          ],
        },
        {
          heading: 'Wo Ihre Daten verarbeitet werden',
          paragraphs: [
            `Unser Unternehmen hat seinen Sitz in China, und unsere Dienstleister verarbeiten Daten in den USA, in der Europäischen Union und in anderen Ländern. Ihre Daten können daher außerhalb Ihres eigenen Landes verarbeitet werden.`,
          ],
        },
        {
          heading: 'Ihre Rechte',
          paragraphs: [
            `Je nach Wohnsitz können Sie Auskunft über die personenbezogenen Daten verlangen, die wir über Sie speichern, und verlangen, dass wir sie berichtigen, löschen, ihre Verarbeitung einschränken oder beenden oder sie Ihnen in einem übertragbaren Format zur Verfügung stellen. Außerdem haben Sie das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren. Für Ihre Anfrage schreiben Sie an ${C_EMAIL}.`,
          ],
        },
        {
          heading: 'Änderungen dieser Erklärung',
          paragraphs: [
            `Wir aktualisieren diese Erklärung, wenn sich die Website ändert. Das Datum oben zeigt den aktuellen Stand.`,
          ],
        },
      ],
    },
    legalNotice: {
      eyebrow: 'Rechtliches',
      title: 'Impressum',
      description: `Anbieterkennzeichnung und rechtliche Hinweise für chengtaimirror.com.`,
      sections: [
        {
          heading: 'Anbieter',
          paragraphs: [C_NAME, C_ADDRESS, ...licenceLines('Gesetzlicher Vertreter', 'Unified Social Credit Code (Registernummer)')],
        },
        { heading: 'Kontakt', paragraphs: [`E-Mail: ${C_EMAIL}`, `Telefon und WhatsApp: ${C_PHONE}`] },
        { heading: 'Hosting', paragraphs: [`Diese Website wird gehostet von ${HOST}.`] },
        {
          heading: 'Haftung für Inhalte',
          paragraphs: [
            `Wir erstellen die Inhalte dieser Website mit Sorgfalt, können aber nicht garantieren, dass alle Angaben vollständig, richtig und aktuell sind. Produktangaben können sich ändern; bitte bestätigen Sie die Details vor einer Bestellung mit unserem Vertriebsteam.`,
          ],
        },
        {
          heading: 'Haftung für Links',
          paragraphs: [
            `Links zu anderen Websites dienen Ihrer Information. Für deren Inhalte sind ausschließlich die jeweiligen Betreiber verantwortlich.`,
          ],
        },
        {
          heading: 'Urheberrecht',
          paragraphs: [
            `Texte, Fotos und Videos auf dieser Website gehören der ${C_NAME}, sofern nicht anders angegeben. Bitte fragen Sie uns, bevor Sie sie weiterverwenden.`,
          ],
        },
      ],
    },
  },

  es: {
    privacy: {
      eyebrow: 'Información legal',
      title: 'Política de privacidad',
      description: `Cómo ${C_NAME} recoge y utiliza datos personales en chengtaimirror.com.`,
      updated: 'Última actualización: 28 de octubre de 2026',
      intro: `Esta política explica qué datos personales recoge chengtaimirror.com, para qué los usamos y qué opciones tiene usted. Solo describe lo que el sitio hace realmente.`,
      sections: [
        {
          heading: 'Responsable del tratamiento',
          paragraphs: [
            `${C_NAME}, ${C_ADDRESS}. Correo electrónico: ${C_EMAIL}.`,
            `Si tiene cualquier pregunta sobre sus datos personales, escríbanos a esta dirección.`,
          ],
        },
        {
          heading: 'Cuando navega por el sitio',
          paragraphs: [
            `El sitio está alojado por Vercel Inc. (EE. UU.). Como cualquier servidor web, registra datos técnicos de cada solicitud: su dirección IP, la fecha y la hora, la página solicitada, su navegador y sistema operativo, y la página de la que procede. Usamos estos datos solo para ofrecer el sitio, mantenerlo seguro y corregir errores (artículo 6, apartado 1, letra f, del RGPD).`,
            `El propio sitio no instala cookies.`,
          ],
        },
        {
          heading: 'Cuando nos envía una consulta',
          paragraphs: [
            `El formulario de consulta solicita su nombre, su correo electrónico y su mensaje y, de forma opcional, su teléfono, empresa, país y el producto que le interesa. Usamos esta información para responderle y preparar presupuestos (artículo 6, apartado 1, letra b, del RGPD).`,
            `Su consulta se guarda en nuestra base de datos, alojada por Supabase Inc., y se envía por correo electrónico a nuestro equipo comercial a través del servicio de correo Resend.`,
            `Conservamos las consultas mientras las necesitemos para atender su solicitud y la relación comercial que pueda derivarse de ella, y las eliminamos cuando usted nos lo pide.`,
          ],
        },
        {
          heading: 'Cuando nos escribe por correo electrónico o WhatsApp',
          paragraphs: [
            `Si nos envía un correo electrónico o un mensaje de WhatsApp, usamos sus datos de contacto y su mensaje para responderle. WhatsApp es un servicio de Meta; a los mensajes enviados por WhatsApp se aplica su propia política de privacidad.`,
          ],
        },
        {
          heading: 'Google Analytics',
          paragraphs: [
            `Usamos Google Analytics 4, un servicio de Google Ireland Limited y Google LLC, para entender cómo se usa el sitio: qué páginas se visitan y durante cuánto tiempo, desde qué tipo de dispositivo y región aproximada, y cómo nos encontraron los visitantes. Google Analytics instala cookies (_ga y _ga_C201XKXR1X) y, según Google, no registra ni almacena direcciones IP. Nuestros datos de analítica están vinculados a nuestra cuenta de Google Ads para que podamos medir nuestra publicidad.`,
            `Lo hacemos porque tenemos un interés legítimo en entender y mejorar nuestro sitio web y nuestra publicidad (artículo 6, apartado 1, letra f, del RGPD). Puede bloquear estas cookies en la configuración de su navegador o instalar el complemento de inhabilitación de Google en ${GA_OPT_OUT}.`,
          ],
        },
        {
          heading: 'Vercel Web Analytics y Speed Insights',
          paragraphs: [
            `También usamos Vercel Web Analytics y Vercel Speed Insights, que cuentan las visitas a las páginas y miden su velocidad de carga sin cookies y sin identificar a visitantes individuales.`,
          ],
        },
        {
          heading: 'Vídeos de YouTube',
          paragraphs: [
            `Nuestras páginas de vídeo integran vídeos de YouTube, un servicio de Google. Cuando se carga un reproductor, YouTube recibe su dirección IP y puede instalar cookies conforme a la política de privacidad de Google. Las imágenes de vista previa de los vídeos también se cargan desde los servidores de YouTube.`,
          ],
        },
        {
          heading: 'Fotos y documentos',
          paragraphs: [
            `Las fotos de productos, los documentos y otros archivos se sirven desde los servidores de almacenamiento de Supabase Inc., que reciben su dirección IP cuando su navegador los carga.`,
          ],
        },
        {
          heading: 'Enlaces a otros sitios web',
          paragraphs: [
            `Enlazamos a nuestros perfiles en Instagram, Facebook y otros sitios web. Son enlaces simples: no se envía nada a esos sitios hasta que usted hace clic en ellos, y a partir de entonces se aplican sus propias políticas de privacidad.`,
          ],
        },
        {
          heading: 'Dónde se tratan sus datos',
          paragraphs: [
            `Nuestra empresa tiene su sede en China, y nuestros proveedores tratan datos en Estados Unidos, la Unión Europea y otros países. Por ello, sus datos pueden tratarse fuera de su propio país.`,
          ],
        },
        {
          heading: 'Sus derechos',
          paragraphs: [
            `Según dónde resida, puede pedirnos acceso a los datos personales que tenemos sobre usted y pedirnos que los corrijamos, los eliminemos, limitemos o cesemos su uso, o se los enviemos en un formato portable. También tiene derecho a presentar una reclamación ante una autoridad de protección de datos. Para hacer una solicitud, escriba a ${C_EMAIL}.`,
          ],
        },
        {
          heading: 'Cambios en esta política',
          paragraphs: [
            `Actualizamos esta política cuando cambia el sitio web. La fecha de arriba indica cuándo se revisó por última vez.`,
          ],
        },
      ],
    },
    legalNotice: {
      eyebrow: 'Información legal',
      title: 'Aviso legal',
      description: `Datos de la empresa e información legal de chengtaimirror.com.`,
      sections: [
        {
          heading: 'Titular del sitio web',
          paragraphs: [C_NAME, C_ADDRESS, ...licenceLines('Representante legal', 'Código de Crédito Social Unificado')],
        },
        { heading: 'Contacto', paragraphs: [`Correo electrónico: ${C_EMAIL}`, `Teléfono y WhatsApp: ${C_PHONE}`] },
        { heading: 'Alojamiento', paragraphs: [`Este sitio web está alojado por ${HOST}.`] },
        {
          heading: 'Responsabilidad por los contenidos',
          paragraphs: [
            `Elaboramos los contenidos de este sitio web con cuidado, pero no podemos garantizar que todos los datos estén completos, sean correctos y estén actualizados. Las especificaciones de los productos pueden cambiar; confírmelas con nuestro equipo comercial antes de realizar un pedido.`,
          ],
        },
        {
          heading: 'Enlaces',
          paragraphs: [
            `Los enlaces a otros sitios web se ofrecen como referencia. Los responsables de esos sitios responden de sus contenidos.`,
          ],
        },
        {
          heading: 'Derechos de autor',
          paragraphs: [
            `Los textos, fotos y vídeos de este sitio web pertenecen a ${C_NAME}, salvo que se indique lo contrario. Pídanos permiso antes de reutilizarlos.`,
          ],
        },
      ],
    },
  },

  fr: {
    privacy: {
      eyebrow: 'Informations légales',
      title: 'Politique de confidentialité',
      description: `Comment ${C_NAME} collecte et utilise les données personnelles sur chengtaimirror.com.`,
      updated: 'Dernière mise à jour : 28 octobre 2026',
      intro: `Cette politique explique quelles données personnelles chengtaimirror.com collecte, pourquoi nous les utilisons et quels choix s'offrent à vous. Elle décrit uniquement ce que fait réellement le site.`,
      sections: [
        {
          heading: 'Responsable du traitement',
          paragraphs: [
            `${C_NAME}, ${C_ADDRESS}. E-mail : ${C_EMAIL}.`,
            `Pour toute question concernant vos données personnelles, écrivez-nous à cette adresse.`,
          ],
        },
        {
          heading: 'Lorsque vous consultez le site',
          paragraphs: [
            `Le site est hébergé par Vercel Inc. (États-Unis). Comme tout serveur web, il enregistre des données techniques pour chaque requête : votre adresse IP, la date et l'heure, la page demandée, votre navigateur et votre système d'exploitation, ainsi que la page d'où vous venez. Nous utilisons ces données uniquement pour fournir le site, le sécuriser et corriger les erreurs (article 6, paragraphe 1, point f, du RGPD).`,
            `Le site lui-même ne dépose aucun cookie.`,
          ],
        },
        {
          heading: 'Lorsque vous nous envoyez une demande',
          paragraphs: [
            `Le formulaire de demande vous demande votre nom, votre adresse e-mail et votre message, et, de manière facultative, votre numéro de téléphone, votre entreprise, votre pays et le produit qui vous intéresse. Nous utilisons ces informations pour vous répondre et établir des devis (article 6, paragraphe 1, point b, du RGPD).`,
            `Votre demande est enregistrée dans notre base de données, hébergée par Supabase Inc., et transmise par e-mail à notre équipe commerciale via le service d'e-mail Resend.`,
            `Nous conservons les demandes aussi longtemps que nécessaire pour traiter votre demande et la relation commerciale qui peut en découler, et nous les supprimons à votre demande.`,
          ],
        },
        {
          heading: 'Lorsque vous nous écrivez par e-mail ou WhatsApp',
          paragraphs: [
            `Si vous nous envoyez un e-mail ou un message WhatsApp, nous utilisons vos coordonnées et votre message pour vous répondre. WhatsApp est exploité par Meta ; sa propre politique de confidentialité s'applique aux messages envoyés via WhatsApp.`,
          ],
        },
        {
          heading: 'Google Analytics',
          paragraphs: [
            `Nous utilisons Google Analytics 4, un service de Google Ireland Limited et de Google LLC, pour comprendre comment les visiteurs utilisent le site : quelles pages sont consultées et pendant combien de temps, depuis quel type d'appareil et quelle région approximative, et comment les visiteurs nous ont trouvés. Google Analytics dépose des cookies (_ga et _ga_C201XKXR1X) et, selon Google, n'enregistre ni ne conserve les adresses IP. Nos données d'analyse sont associées à notre compte Google Ads afin que nous puissions mesurer notre publicité.`,
            `Nous le faisons parce que nous avons un intérêt légitime à comprendre et à améliorer notre site et notre publicité (article 6, paragraphe 1, point f, du RGPD). Vous pouvez bloquer ces cookies dans les paramètres de votre navigateur ou installer le module de désactivation de Google à l'adresse ${GA_OPT_OUT}.`,
          ],
        },
        {
          heading: 'Vercel Web Analytics et Speed Insights',
          paragraphs: [
            `Nous utilisons également Vercel Web Analytics et Vercel Speed Insights, qui comptent les pages vues et mesurent la vitesse de chargement sans cookies et sans identifier les visiteurs individuellement.`,
          ],
        },
        {
          heading: 'Vidéos YouTube',
          paragraphs: [
            `Nos pages vidéo intègrent des vidéos de YouTube, un service de Google. Lorsqu'un lecteur vidéo se charge, YouTube reçoit votre adresse IP et peut déposer des cookies conformément à la politique de confidentialité de Google. Les images d'aperçu des vidéos sont également chargées depuis les serveurs de YouTube.`,
          ],
        },
        {
          heading: 'Photos et documents',
          paragraphs: [
            `Les photos de produits, les documents et les autres fichiers sont fournis par les serveurs de stockage de Supabase Inc., qui reçoivent votre adresse IP lorsque votre navigateur les charge.`,
          ],
        },
        {
          heading: "Liens vers d'autres sites",
          paragraphs: [
            `Nous proposons des liens vers nos profils sur Instagram, Facebook et d'autres sites. Il s'agit de simples liens : aucune donnée n'est envoyée à ces sites tant que vous ne cliquez pas dessus, et leurs propres politiques de confidentialité s'appliquent ensuite.`,
          ],
        },
        {
          heading: 'Où vos données sont traitées',
          paragraphs: [
            `Notre entreprise est établie en Chine, et nos prestataires traitent des données aux États-Unis, dans l'Union européenne et dans d'autres pays. Vos données peuvent donc être traitées en dehors de votre pays.`,
          ],
        },
        {
          heading: 'Vos droits',
          paragraphs: [
            `Selon votre lieu de résidence, vous pouvez nous demander d'accéder aux données personnelles que nous détenons sur vous, de les rectifier, de les supprimer, d'en limiter ou d'en faire cesser l'utilisation, ou de vous les transmettre dans un format portable. Vous avez également le droit d'introduire une réclamation auprès d'une autorité de protection des données. Pour toute demande, écrivez à ${C_EMAIL}.`,
          ],
        },
        {
          heading: 'Modifications de cette politique',
          paragraphs: [
            `Nous mettons à jour cette politique lorsque le site évolue. La date indiquée en haut correspond à la dernière révision.`,
          ],
        },
      ],
    },
    legalNotice: {
      eyebrow: 'Informations légales',
      title: 'Mentions légales',
      description: `Informations sur l'éditeur et mentions légales de chengtaimirror.com.`,
      sections: [
        {
          heading: 'Éditeur du site',
          paragraphs: [C_NAME, C_ADDRESS, ...licenceLines('Représentant légal', 'Code de crédit social unifié')],
        },
        { heading: 'Contact', paragraphs: [`E-mail : ${C_EMAIL}`, `Téléphone et WhatsApp : ${C_PHONE}`] },
        { heading: 'Hébergement', paragraphs: [`Ce site est hébergé par ${HOST}.`] },
        {
          heading: 'Responsabilité quant au contenu',
          paragraphs: [
            `Nous préparons le contenu de ce site avec soin, mais nous ne pouvons garantir que toutes les informations soient complètes, exactes et à jour. Les caractéristiques des produits peuvent changer ; veuillez les confirmer avec notre équipe commerciale avant de commander.`,
          ],
        },
        {
          heading: 'Liens',
          paragraphs: [
            `Les liens vers d'autres sites sont fournis à titre indicatif. Leurs éditeurs sont responsables de leur contenu.`,
          ],
        },
        {
          heading: "Droits d'auteur",
          paragraphs: [
            `Les textes, photos et vidéos de ce site appartiennent à ${C_NAME}, sauf mention contraire. Merci de nous demander l'autorisation avant de les réutiliser.`,
          ],
        },
      ],
    },
  },

  it: {
    privacy: {
      eyebrow: 'Informazioni legali',
      title: 'Informativa sulla privacy',
      description: `Come ${C_NAME} raccoglie e utilizza i dati personali su chengtaimirror.com.`,
      updated: 'Ultimo aggiornamento: 28 ottobre 2026',
      intro: `Questa informativa spiega quali dati personali raccoglie chengtaimirror.com, perché li utilizziamo e quali scelte ha a disposizione. Descrive solo ciò che il sito fa realmente.`,
      sections: [
        {
          heading: 'Titolare del trattamento',
          paragraphs: [
            `${C_NAME}, ${C_ADDRESS}. E-mail: ${C_EMAIL}.`,
            `Per qualsiasi domanda sui suoi dati personali, ci scriva a questo indirizzo.`,
          ],
        },
        {
          heading: 'Quando visita il sito',
          paragraphs: [
            `Il sito è ospitato da Vercel Inc. (USA). Come ogni server web, registra dati tecnici per ogni richiesta: il suo indirizzo IP, data e ora, la pagina richiesta, il browser e il sistema operativo e la pagina di provenienza. Utilizziamo questi dati solo per fornire il sito, mantenerlo sicuro e correggere errori (articolo 6, paragrafo 1, lettera f, del GDPR).`,
            `Il sito stesso non imposta cookie.`,
          ],
        },
        {
          heading: 'Quando ci invia una richiesta',
          paragraphs: [
            `Il modulo di richiesta chiede nome, indirizzo e-mail e messaggio e, facoltativamente, numero di telefono, azienda, paese e il prodotto di suo interesse. Utilizziamo queste informazioni per risponderle e preparare preventivi (articolo 6, paragrafo 1, lettera b, del GDPR).`,
            `La sua richiesta viene salvata nel nostro database, ospitato da Supabase Inc., e inoltrata via e-mail al nostro team commerciale tramite il servizio di posta elettronica Resend.`,
            `Conserviamo le richieste per il tempo necessario a gestirle e per l'eventuale rapporto commerciale che ne deriva, e le cancelliamo su sua richiesta.`,
          ],
        },
        {
          heading: 'Quando ci scrive via e-mail o WhatsApp',
          paragraphs: [
            `Se ci invia un'e-mail o un messaggio WhatsApp, utilizziamo i suoi dati di contatto e il suo messaggio per risponderle. WhatsApp è gestito da Meta; ai messaggi inviati tramite WhatsApp si applica la sua informativa sulla privacy.`,
          ],
        },
        {
          heading: 'Google Analytics',
          paragraphs: [
            `Utilizziamo Google Analytics 4, un servizio di Google Ireland Limited e Google LLC, per capire come i visitatori usano il sito: quali pagine vengono visitate e per quanto tempo, da quale tipo di dispositivo e da quale area geografica approssimativa, e come i visitatori ci hanno trovato. Google Analytics imposta cookie (_ga e _ga_C201XKXR1X) e, secondo Google, non registra né conserva indirizzi IP. I nostri dati di analisi sono collegati al nostro account Google Ads per misurare la nostra pubblicità.`,
            `Lo facciamo perché abbiamo un legittimo interesse a comprendere e migliorare il nostro sito e la nostra pubblicità (articolo 6, paragrafo 1, lettera f, del GDPR). Può bloccare questi cookie nelle impostazioni del browser o installare il componente aggiuntivo di disattivazione di Google all'indirizzo ${GA_OPT_OUT}.`,
          ],
        },
        {
          heading: 'Vercel Web Analytics e Speed Insights',
          paragraphs: [
            `Utilizziamo anche Vercel Web Analytics e Vercel Speed Insights, che contano le visualizzazioni di pagina e misurano la velocità di caricamento senza cookie e senza identificare i singoli visitatori.`,
          ],
        },
        {
          heading: 'Video di YouTube',
          paragraphs: [
            `Le nostre pagine video incorporano video di YouTube, un servizio di Google. Quando un lettore video viene caricato, YouTube riceve il suo indirizzo IP e può impostare cookie secondo l'informativa sulla privacy di Google. Anche le immagini di anteprima dei video vengono caricate dai server di YouTube.`,
          ],
        },
        {
          heading: 'Foto e documenti',
          paragraphs: [
            `Le foto dei prodotti, i documenti e gli altri file vengono forniti dai server di archiviazione di Supabase Inc., che ricevono il suo indirizzo IP quando il browser li carica.`,
          ],
        },
        {
          heading: 'Link ad altri siti',
          paragraphs: [
            `Inseriamo link ai nostri profili su Instagram, Facebook e altri siti. Sono semplici link: a questi siti non viene inviato nulla finché non ci clicca sopra, dopodiché si applicano le loro informative sulla privacy.`,
          ],
        },
        {
          heading: 'Dove vengono trattati i suoi dati',
          paragraphs: [
            `La nostra azienda ha sede in Cina e i nostri fornitori trattano dati negli Stati Uniti, nell'Unione europea e in altri paesi. I suoi dati possono quindi essere trattati al di fuori del suo paese.`,
          ],
        },
        {
          heading: 'I suoi diritti',
          paragraphs: [
            `A seconda del luogo in cui vive, può chiederci l'accesso ai dati personali che conserviamo su di lei e chiederci di rettificarli, cancellarli, limitarne o interromperne l'uso, oppure di trasmetterglieli in un formato portabile. Ha inoltre il diritto di presentare reclamo a un'autorità per la protezione dei dati. Per una richiesta scriva a ${C_EMAIL}.`,
          ],
        },
        {
          heading: 'Modifiche a questa informativa',
          paragraphs: [
            `Aggiorniamo questa informativa quando il sito cambia. La data in alto indica l'ultima revisione.`,
          ],
        },
      ],
    },
    legalNotice: {
      eyebrow: 'Informazioni legali',
      title: 'Note legali',
      description: `Dati societari e note legali di chengtaimirror.com.`,
      sections: [
        {
          heading: 'Gestore del sito',
          paragraphs: [C_NAME, C_ADDRESS, ...licenceLines('Rappresentante legale', 'Codice unificato di credito sociale')],
        },
        { heading: 'Contatti', paragraphs: [`E-mail: ${C_EMAIL}`, `Telefono e WhatsApp: ${C_PHONE}`] },
        { heading: 'Hosting', paragraphs: [`Questo sito è ospitato da ${HOST}.`] },
        {
          heading: 'Responsabilità per i contenuti',
          paragraphs: [
            `Prepariamo i contenuti di questo sito con cura, ma non possiamo garantire che tutte le informazioni siano complete, corrette e aggiornate. Le specifiche dei prodotti possono cambiare; la preghiamo di confermarle con il nostro team commerciale prima di ordinare.`,
          ],
        },
        {
          heading: 'Link',
          paragraphs: [
            `I link ad altri siti sono forniti a titolo informativo. I rispettivi gestori sono responsabili dei loro contenuti.`,
          ],
        },
        {
          heading: "Diritto d'autore",
          paragraphs: [
            `Testi, foto e video di questo sito appartengono a ${C_NAME}, salvo diversa indicazione. Ci chieda il permesso prima di riutilizzarli.`,
          ],
        },
      ],
    },
  },

  pt: {
    privacy: {
      eyebrow: 'Informações legais',
      title: 'Política de privacidade',
      description: `Como a ${C_NAME} coleta e usa dados pessoais em chengtaimirror.com.`,
      updated: 'Última atualização: 28 de outubro de 2026',
      intro: `Esta política explica quais dados pessoais o chengtaimirror.com coleta, por que os usamos e quais escolhas você tem. Ela descreve apenas o que o site realmente faz.`,
      sections: [
        {
          heading: 'Controlador dos dados',
          paragraphs: [
            `${C_NAME}, ${C_ADDRESS}. E-mail: ${C_EMAIL}.`,
            `Para qualquer dúvida sobre seus dados pessoais, escreva para este endereço.`,
          ],
        },
        {
          heading: 'Quando você navega pelo site',
          paragraphs: [
            `O site é hospedado pela Vercel Inc. (EUA). Como qualquer servidor web, ele registra dados técnicos de cada solicitação: seu endereço IP, data e hora, a página solicitada, seu navegador e sistema operacional e a página de onde você veio. Usamos esses dados apenas para disponibilizar o site, mantê-lo seguro e corrigir erros (artigo 6.º, n.º 1, alínea f, do RGPD).`,
            `O próprio site não usa cookies.`,
          ],
        },
        {
          heading: 'Quando você nos envia uma consulta',
          paragraphs: [
            `O formulário de consulta pede seu nome, e-mail e mensagem e, opcionalmente, telefone, empresa, país e o produto de seu interesse. Usamos essas informações para responder e preparar orçamentos (artigo 6.º, n.º 1, alínea b, do RGPD).`,
            `Sua consulta é armazenada em nosso banco de dados, hospedado pela Supabase Inc., e encaminhada por e-mail à nossa equipe comercial por meio do serviço de e-mail Resend.`,
            `Mantemos as consultas pelo tempo necessário para atender sua solicitação e a eventual relação comercial que dela resulte, e as excluímos quando você pedir.`,
          ],
        },
        {
          heading: 'Quando você nos escreve por e-mail ou WhatsApp',
          paragraphs: [
            `Se você nos enviar um e-mail ou uma mensagem pelo WhatsApp, usamos seus dados de contato e sua mensagem para responder. O WhatsApp é operado pela Meta; às mensagens enviadas pelo WhatsApp aplica-se a política de privacidade dela.`,
          ],
        },
        {
          heading: 'Google Analytics',
          paragraphs: [
            `Usamos o Google Analytics 4, um serviço da Google Ireland Limited e da Google LLC, para entender como os visitantes usam o site: quais páginas são vistas e por quanto tempo, de que tipo de dispositivo e de qual região aproximada, e como os visitantes nos encontraram. O Google Analytics usa cookies (_ga e _ga_C201XKXR1X) e, segundo o Google, não registra nem armazena endereços IP. Nossos dados de análise estão vinculados à nossa conta do Google Ads para que possamos medir nossa publicidade.`,
            `Fazemos isso porque temos um interesse legítimo em entender e melhorar nosso site e nossa publicidade (artigo 6.º, n.º 1, alínea f, do RGPD). Você pode bloquear esses cookies nas configurações do navegador ou instalar o complemento de desativação do Google em ${GA_OPT_OUT}.`,
          ],
        },
        {
          heading: 'Vercel Web Analytics e Speed Insights',
          paragraphs: [
            `Também usamos o Vercel Web Analytics e o Vercel Speed Insights, que contam visualizações de página e medem a velocidade de carregamento sem cookies e sem identificar visitantes individuais.`,
          ],
        },
        {
          heading: 'Vídeos do YouTube',
          paragraphs: [
            `Nossas páginas de vídeo incorporam vídeos do YouTube, um serviço do Google. Quando um player de vídeo é carregado, o YouTube recebe seu endereço IP e pode usar cookies, de acordo com a política de privacidade do Google. As imagens de prévia dos vídeos também são carregadas dos servidores do YouTube.`,
          ],
        },
        {
          heading: 'Fotos e documentos',
          paragraphs: [
            `Fotos de produtos, documentos e outros arquivos são fornecidos pelos servidores de armazenamento da Supabase Inc., que recebem seu endereço IP quando o navegador os carrega.`,
          ],
        },
        {
          heading: 'Links para outros sites',
          paragraphs: [
            `Incluímos links para nossos perfis no Instagram, no Facebook e em outros sites. São links simples: nada é enviado a esses sites até que você clique neles, e a partir daí valem as políticas de privacidade deles.`,
          ],
        },
        {
          heading: 'Onde seus dados são tratados',
          paragraphs: [
            `Nossa empresa está sediada na China, e nossos fornecedores tratam dados nos Estados Unidos, na União Europeia e em outros países. Por isso, seus dados podem ser tratados fora do seu país.`,
          ],
        },
        {
          heading: 'Seus direitos',
          paragraphs: [
            `Dependendo de onde você mora, você pode nos pedir acesso aos dados pessoais que temos sobre você e pedir que os corrijamos, excluamos, limitemos ou interrompamos seu uso, ou que os enviemos a você em formato portátil. Você também tem o direito de apresentar uma reclamação a uma autoridade de proteção de dados. Para fazer uma solicitação, escreva para ${C_EMAIL}.`,
          ],
        },
        {
          heading: 'Alterações nesta política',
          paragraphs: [
            `Atualizamos esta política quando o site muda. A data no topo indica a última revisão.`,
          ],
        },
      ],
    },
    legalNotice: {
      eyebrow: 'Informações legais',
      title: 'Aviso legal',
      description: `Dados da empresa e informações legais do chengtaimirror.com.`,
      sections: [
        {
          heading: 'Responsável pelo site',
          paragraphs: [C_NAME, C_ADDRESS, ...licenceLines('Representante legal', 'Código Unificado de Crédito Social')],
        },
        { heading: 'Contato', paragraphs: [`E-mail: ${C_EMAIL}`, `Telefone e WhatsApp: ${C_PHONE}`] },
        { heading: 'Hospedagem', paragraphs: [`Este site é hospedado pela ${HOST}.`] },
        {
          heading: 'Responsabilidade pelo conteúdo',
          paragraphs: [
            `Preparamos o conteúdo deste site com cuidado, mas não podemos garantir que todas as informações estejam completas, corretas e atualizadas. As especificações dos produtos podem mudar; confirme-as com nossa equipe comercial antes de fazer um pedido.`,
          ],
        },
        {
          heading: 'Links',
          paragraphs: [
            `Os links para outros sites são fornecidos para sua conveniência. Os responsáveis por esses sites respondem pelo conteúdo deles.`,
          ],
        },
        {
          heading: 'Direitos autorais',
          paragraphs: [
            `Textos, fotos e vídeos deste site pertencem à ${C_NAME}, salvo indicação em contrário. Peça autorização antes de reutilizá-los.`,
          ],
        },
      ],
    },
  },

  he: {
    privacy: {
      eyebrow: 'מידע משפטי',
      title: 'מדיניות פרטיות',
      description: `כיצד ${C_NAME} אוספת ומשתמשת במידע אישי באתר chengtaimirror.com.`,
      updated: 'עודכן לאחרונה: 28 באוקטובר 2026',
      intro: `מדיניות זו מסבירה איזה מידע אישי האתר chengtaimirror.com אוסף, לשם מה אנו משתמשים בו ואילו אפשרויות עומדות לרשותך. היא מתארת רק את מה שהאתר עושה בפועל.`,
      sections: [
        {
          heading: 'האחראי על המידע',
          paragraphs: [
            `${C_NAME}, ${C_ADDRESS}. דוא״ל: ${C_EMAIL}.`,
            `לכל שאלה בנוגע למידע האישי שלך, אפשר לכתוב לנו לכתובת זו.`,
          ],
        },
        {
          heading: 'בעת גלישה באתר',
          paragraphs: [
            `האתר מאוחסן על ידי Vercel Inc. (ארה״ב). כמו כל שרת אינטרנט, הוא רושם נתונים טכניים בכל בקשה: כתובת ה-IP שלך, התאריך והשעה, הדף המבוקש, הדפדפן ומערכת ההפעלה, והדף שממנו הגעת. אנו משתמשים בנתונים אלה רק כדי להפעיל את האתר, לשמור על אבטחתו ולתקן תקלות (סעיף 6(1)(f) ל-GDPR).`,
            `האתר עצמו אינו שומר עוגיות (cookies).`,
          ],
        },
        {
          heading: 'שליחת פנייה אלינו',
          paragraphs: [
            `טופס הפנייה מבקש שם, כתובת דוא״ל והודעה, ובאופן אופציונלי גם מספר טלפון, חברה, מדינה והמוצר שמעניין אותך. אנו משתמשים במידע זה כדי להשיב לך ולהכין הצעות מחיר (סעיף 6(1)(b) ל-GDPR).`,
            `הפנייה נשמרת במסד הנתונים שלנו, המאוחסן אצל Supabase Inc., ומועברת בדוא״ל לצוות המכירות שלנו באמצעות שירות הדוא״ל Resend.`,
            `אנו שומרים פניות כל עוד הן נחוצות לטיפול בבקשה ולקשר העסקי שעשוי לנבוע ממנה, ומוחקים אותן לפי בקשתך.`,
          ],
        },
        {
          heading: 'פנייה בדוא״ל או ב-WhatsApp',
          paragraphs: [
            `אם תכתבו לנו בדוא״ל או ב-WhatsApp, נשתמש בפרטי הקשר ובהודעה כדי להשיב. WhatsApp מופעל על ידי Meta, ועל הודעות שנשלחות דרכו חלה מדיניות הפרטיות שלה.`,
          ],
        },
        {
          heading: 'Google Analytics',
          paragraphs: [
            `אנו משתמשים ב-Google Analytics 4, שירות של Google Ireland Limited ו-Google LLC, כדי להבין כיצד מבקרים משתמשים באתר: אילו דפים נצפים ולכמה זמן, מאיזה סוג מכשיר ומאיזה אזור משוער, וכיצד המבקרים מצאו אותנו. Google Analytics שומר עוגיות (_ga ו-_ga_C201XKXR1X), ולפי Google אינו רושם או שומר כתובות IP. נתוני הניתוח שלנו מקושרים לחשבון Google Ads שלנו כדי שנוכל למדוד את הפרסום שלנו.`,
            `אנו עושים זאת מתוך אינטרס לגיטימי להבין ולשפר את האתר והפרסום שלנו (סעיף 6(1)(f) ל-GDPR). אפשר לחסום עוגיות אלה בהגדרות הדפדפן או להתקין את תוסף הביטול של Google בכתובת ${GA_OPT_OUT}.`,
          ],
        },
        {
          heading: 'Vercel Web Analytics ו-Speed Insights',
          paragraphs: [
            `אנו משתמשים גם ב-Vercel Web Analytics וב-Vercel Speed Insights, הסופרים צפיות בדפים ומודדים את מהירות הטעינה ללא עוגיות וללא זיהוי מבקרים בודדים.`,
          ],
        },
        {
          heading: 'סרטוני YouTube',
          paragraphs: [
            `דפי הווידאו שלנו משלבים סרטונים מ-YouTube, שירות של Google. כאשר נגן וידאו נטען, YouTube מקבל את כתובת ה-IP שלך ועשוי לשמור עוגיות בהתאם למדיניות הפרטיות של Google. גם תמונות התצוגה המקדימה של הסרטונים נטענות משרתי YouTube.`,
          ],
        },
        {
          heading: 'תמונות ומסמכים',
          paragraphs: [
            `תמונות מוצרים, מסמכים וקבצים אחרים מוגשים משרתי האחסון של Supabase Inc., המקבלים את כתובת ה-IP שלך כאשר הדפדפן טוען אותם.`,
          ],
        },
        {
          heading: 'קישורים לאתרים אחרים',
          paragraphs: [
            `אנו מקשרים לפרופילים שלנו ב-Instagram, ב-Facebook ובאתרים אחרים. אלה קישורים פשוטים: דבר אינו נשלח לאתרים אלה עד שלוחצים עליהם, ומאותו רגע חלה מדיניות הפרטיות שלהם.`,
          ],
        },
        {
          heading: 'היכן המידע מעובד',
          paragraphs: [
            `החברה שלנו ממוקמת בסין, וספקי השירות שלנו מעבדים מידע בארצות הברית, באיחוד האירופי ובמדינות נוספות. לכן המידע שלך עשוי להיות מעובד מחוץ למדינתך.`,
          ],
        },
        {
          heading: 'הזכויות שלך',
          paragraphs: [
            `בהתאם למקום מגוריך, באפשרותך לבקש גישה למידע האישי שאנו מחזיקים עליך, ולבקש שנתקן אותו, נמחק אותו, נגביל או נפסיק את השימוש בו, או נעביר אותו אליך בפורמט נייד. כמו כן יש לך זכות להגיש תלונה לרשות להגנת המידע. לשליחת בקשה כתבו לכתובת ${C_EMAIL}.`,
          ],
        },
        {
          heading: 'שינויים במדיניות זו',
          paragraphs: [`אנו מעדכנים מדיניות זו כאשר האתר משתנה. התאריך בראש הדף מציין את העדכון האחרון.`],
        },
      ],
    },
    legalNotice: {
      eyebrow: 'מידע משפטי',
      title: 'הודעה משפטית',
      description: `פרטי החברה ומידע משפטי עבור chengtaimirror.com.`,
      sections: [
        {
          heading: 'מפעיל האתר',
          paragraphs: [C_NAME, C_ADDRESS, ...licenceLines('נציג משפטי', 'Unified Social Credit Code')],
        },
        { heading: 'יצירת קשר', paragraphs: [`דוא״ל: ${C_EMAIL}`, `טלפון ו-WhatsApp: ${C_PHONE}`] },
        { heading: 'אחסון', paragraphs: [`האתר מאוחסן על ידי ${HOST}.`] },
        {
          heading: 'אחריות לתוכן',
          paragraphs: [
            `אנו מכינים את תוכן האתר בקפידה, אך איננו יכולים להבטיח שכל הפרטים מלאים, נכונים ועדכניים. מפרטי המוצרים עשויים להשתנות; אנא אשרו אותם מול צוות המכירות שלנו לפני הזמנה.`,
          ],
        },
        {
          heading: 'קישורים',
          paragraphs: [`קישורים לאתרים אחרים ניתנים לנוחותך. מפעילי אותם אתרים אחראים לתוכנם.`],
        },
        {
          heading: 'זכויות יוצרים',
          paragraphs: [
            `הטקסטים, התמונות והסרטונים באתר שייכים ל-${C_NAME}, אלא אם צוין אחרת. אנא בקשו רשות לפני שימוש חוזר בהם.`,
          ],
        },
      ],
    },
  },
};

export function legalDocument(locale: string, key: LegalPageKey): LegalDocument {
  return (DOCUMENTS[locale] ?? DOCUMENTS[defaultLocale])[key];
}

/**
 * Indexable like the other static pages, with canonical and hreflang
 * alternates; robots come from the locale layout (Hebrew stays noindex), and
 * both paths are listed in sitemap.ts.
 */
export function legalMetadata(locale: string, key: LegalPageKey): Metadata {
  const doc = legalDocument(locale, key);
  return {
    title: `${doc.title} | ${localizedSiteName(locale)}`,
    description: doc.description,
    alternates: buildAlternates(locale, LEGAL_PAGE_PATHS[key]),
  };
}
