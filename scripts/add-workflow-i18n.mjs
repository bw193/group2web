// Inserts home.workflow.* into every locale JSON as a sibling immediately
// before the existing home.exhibition block. String-based, minimal-diff.
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const T = {
  en: {
    eyebrow: 'Our Process',
    heading: 'Customization Workflow',
    body: 'From the first conversation to finished production — a clear three-step path to your custom mirror program.',
    step1Title: 'Consultation & Requirement Gathering',
    step1Desc: 'Our professional sales team collaborate closely with you to fully understand your product requirements, specifications, and project objectives.',
    step2Title: 'Sampling Development',
    step2Desc: 'We create custom samples and prototypes based on your confirmed requirements for your review and approval.',
    step3Title: 'Mass Production & Quality Assurance',
    step3Desc: 'After sample approval, we proceed to full-scale mass production with strict quality control throughout every stage.',
  },
  es: {
    eyebrow: 'Nuestro Proceso',
    heading: 'Flujo de Personalización',
    body: 'Desde la primera conversación hasta la producción final: un camino claro de tres pasos hacia su programa de espejos personalizados.',
    step1Title: 'Consulta y Recopilación de Requisitos',
    step1Desc: 'Nuestro equipo comercial profesional colabora estrechamente con usted para comprender plenamente sus requisitos de producto, especificaciones y objetivos del proyecto.',
    step2Title: 'Desarrollo de Muestras',
    step2Desc: 'Creamos muestras y prototipos personalizados según sus requisitos confirmados para su revisión y aprobación.',
    step3Title: 'Producción en Serie y Control de Calidad',
    step3Desc: 'Tras la aprobación de la muestra, procedemos a la producción en serie a gran escala con un riguroso control de calidad en cada etapa.',
  },
  pt: {
    eyebrow: 'Nosso Processo',
    heading: 'Fluxo de Personalização',
    body: 'Da primeira conversa à produção final — um caminho claro de três etapas para o seu programa de espelhos personalizados.',
    step1Title: 'Consulta e Levantamento de Requisitos',
    step1Desc: 'Nossa equipe de vendas profissional colabora de perto com você para compreender plenamente seus requisitos de produto, especificações e objetivos do projeto.',
    step2Title: 'Desenvolvimento de Amostras',
    step2Desc: 'Criamos amostras e protótipos personalizados com base nos requisitos confirmados para sua análise e aprovação.',
    step3Title: 'Produção em Massa e Garantia de Qualidade',
    step3Desc: 'Após a aprovação da amostra, avançamos para a produção em massa em larga escala com rigoroso controle de qualidade em todas as etapas.',
  },
  fr: {
    eyebrow: 'Notre Processus',
    heading: 'Processus de Personnalisation',
    body: 'De la première conversation à la production finale — un parcours clair en trois étapes vers votre programme de miroirs personnalisés.',
    step1Title: 'Consultation et Recueil des Besoins',
    step1Desc: 'Notre équipe commerciale professionnelle collabore étroitement avec vous pour comprendre pleinement vos exigences produit, vos spécifications et les objectifs de votre projet.',
    step2Title: "Développement d'Échantillons",
    step2Desc: 'Nous créons des échantillons et des prototypes personnalisés à partir de vos exigences confirmées, pour votre examen et votre approbation.',
    step3Title: 'Production en Série et Assurance Qualité',
    step3Desc: "Après approbation de l'échantillon, nous lançons la production en série à grande échelle avec un contrôle qualité rigoureux à chaque étape.",
  },
  it: {
    eyebrow: 'Il Nostro Processo',
    heading: 'Flusso di Personalizzazione',
    body: 'Dalla prima conversazione alla produzione finale: un percorso chiaro in tre fasi verso il vostro programma di specchi personalizzati.',
    step1Title: 'Consulenza e Raccolta dei Requisiti',
    step1Desc: 'Il nostro team commerciale professionale collabora a stretto contatto con voi per comprendere appieno i requisiti di prodotto, le specifiche e gli obiettivi del progetto.',
    step2Title: 'Sviluppo dei Campioni',
    step2Desc: 'Realizziamo campioni e prototipi personalizzati in base ai requisiti confermati, per la vostra revisione e approvazione.',
    step3Title: 'Produzione in Serie e Garanzia di Qualità',
    step3Desc: "Dopo l'approvazione del campione, procediamo con la produzione in serie su larga scala con un rigoroso controllo qualità in ogni fase.",
  },
  de: {
    eyebrow: 'Unser Prozess',
    heading: 'Maßgeschneiderter Fertigungsablauf',
    body: 'Vom ersten Gespräch bis zur fertigen Produktion — ein klarer Weg in drei Schritten zu Ihrem individuellen Spiegelprogramm.',
    step1Title: 'Beratung & Anforderungsanalyse',
    step1Desc: 'Unser professionelles Vertriebsteam arbeitet eng mit Ihnen zusammen, um Ihre Produktanforderungen, Spezifikationen und Projektziele vollständig zu verstehen.',
    step2Title: 'Musterentwicklung',
    step2Desc: 'Wir erstellen individuelle Muster und Prototypen auf Basis Ihrer bestätigten Anforderungen zur Prüfung und Freigabe.',
    step3Title: 'Serienproduktion & Qualitätssicherung',
    step3Desc: 'Nach Freigabe des Musters gehen wir in die großserielle Produktion mit strenger Qualitätskontrolle in jeder Phase.',
  },
  he: {
    eyebrow: 'התהליך שלנו',
    heading: 'תהליך ההתאמה האישית',
    body: 'מהשיחה הראשונה ועד לייצור הסופי — מסלול ברור בן שלושה שלבים לתוכנית המראות המותאמת אישית שלכם.',
    step1Title: 'ייעוץ ואיסוף דרישות',
    step1Desc: 'צוות המכירות המקצועי שלנו עובד בשיתוף פעולה צמוד אתכם כדי להבין במלואן את דרישות המוצר, המפרטים ויעדי הפרויקט.',
    step2Title: 'פיתוח דגימות',
    step2Desc: 'אנו יוצרים דגימות ואבות-טיפוס מותאמים אישית על בסיס הדרישות שאישרתם, לבדיקתכם ולאישורכם.',
    step3Title: 'ייצור המוני והבטחת איכות',
    step3Desc: 'לאחר אישור הדגימה אנו עוברים לייצור המוני בקנה מידה מלא עם בקרת איכות קפדנית בכל שלב.',
  },
};

const ROOT = 'D:/group2web/src/i18n/messages';
const ANCHOR = /^(\s*)"exhibition": \{/m;

for (const [locale, c] of Object.entries(T)) {
  const path = join(ROOT, `${locale}.json`);
  const src = readFileSync(path, 'utf8');

  if (src.includes('"workflow"')) {
    console.log(`[skip] ${locale}: already present`);
    continue;
  }
  const m = src.match(ANCHOR);
  if (!m) {
    console.error(`[fail] ${locale}: anchor not found`);
    continue;
  }
  const ind = m[1].replace(/^\n/, ''); // indent of the "exhibition": key (e.g. 4 spaces)
  const i2 = ind + '  ';
  const block =
    `${ind}"workflow": {\n` +
    `${i2}"eyebrow": ${JSON.stringify(c.eyebrow)},\n` +
    `${i2}"heading": ${JSON.stringify(c.heading)},\n` +
    `${i2}"body": ${JSON.stringify(c.body)},\n` +
    `${i2}"step1Title": ${JSON.stringify(c.step1Title)},\n` +
    `${i2}"step1Desc": ${JSON.stringify(c.step1Desc)},\n` +
    `${i2}"step2Title": ${JSON.stringify(c.step2Title)},\n` +
    `${i2}"step2Desc": ${JSON.stringify(c.step2Desc)},\n` +
    `${i2}"step3Title": ${JSON.stringify(c.step3Title)},\n` +
    `${i2}"step3Desc": ${JSON.stringify(c.step3Desc)}\n` +
    `${ind}},\n${ind}"exhibition": {`;

  const next = src.replace(ANCHOR, block.replace(/\$/g, '$$$$'));

  try {
    JSON.parse(next);
  } catch (err) {
    console.error(`[fail] ${locale}: invalid JSON — ${err.message}`);
    continue;
  }
  writeFileSync(path, next, 'utf8');
  console.log(`[ok] ${locale}`);
}
