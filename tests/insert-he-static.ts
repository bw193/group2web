// Insert Hebrew (he) translations for the non-product content: product
// categories, homepage FAQs, and the About page. Idempotent — deletes any
// existing he rows for these tables first, then re-inserts. Run:
//   npx tsx tests/insert-he-static.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import {
  categoryTranslations,
  faqTranslations,
  faqs,
  aboutPage,
} from '../src/lib/db/schema';

// Category Hebrew names keyed by the (locale-independent) English slug.
const CATEGORY_HE: Record<string, string> = {
  'led-mirrors': 'מראות LED',
  'bathroom-mirrors': 'מראות אמבטיה',
  'full-length-mirrors': 'מראות גוף מלא',
  'mirror-cabinets': 'ארונות מראה',
};

// FAQ Hebrew Q/A keyed by a stable substring of the English question.
const FAQ_HE: { match: string; question: string; answer: string }[] = [
  {
    match: 'proceed an order',
    question: 'כיצד לבצע הזמנה?',
    answer:
      'ראשית, ספרו לנו על הדרישות או היישום שלכם. שנית, אנו מתמחרים בהתאם לדרישותיכם או להמלצותינו. שלישית, הלקוח מאשר את הדוגמאות ומפקיד מקדמה להזמנה רשמית. רביעית, אנו מארגנים את הייצור.',
  },
  {
    match: 'delivery time',
    question: 'מהו זמן האספקה שלכם?',
    answer:
      'בדרך כלל 5–10 ימים אם המוצרים במלאי, או 15–20 ימים אם אינם במלאי, בהתאם לכמות.',
  },
  {
    match: 'sample order',
    question: 'האם אתם מקבלים הזמנת דוגמה?',
    answer: 'כן, אנו מאפשרים ללקוחותינו להזמין דוגמה לבדיקת איכות ותפקוד.',
  },
  {
    match: 'own factory',
    question: 'האם יש לכם מפעל משלכם?',
    answer:
      'כן, אנו מתמחים בתחום ייצור המראות חמש עשרה שנים, ומייצרים מראות LED, מראות אמבטיה, מראות איפור ועוד.',
  },
  {
    match: 'own logo',
    question: 'האם נוכל להדפיס לוגו משלנו על המוצרים?',
    answer:
      'כן, אנא הודיעו לנו באופן רשמי לפני הייצור ואשרו תחילה את העיצוב על בסיס הדוגמה שלנו.',
  },
  {
    match: 'guarantee',
    question: 'האם אתם מציעים אחריות על המוצרים?',
    answer: 'כן, אנו מספקים אחריות לשנתיים על מוצרינו.',
  },
];

const ABOUT_HE_CONTENT = `<p>שנוסדה בשנת 2005, חברת Jiaxing Chengtai Mirror Co., Ltd. היא יצרנית מובילה המתמחה בפתרונות מראות יוקרתיים, כולל מראות LED, מראות אמבטיה ומראות גוף מלא. המתקן המתקדם שבבעלותנו משתרע על פני 35,000 מ״ר בג׳יאשינג, ז׳ג׳יאנג — ממוקם אסטרטגית במרחק 60 ק״מ בלבד מנמל שנגחאי ללוגיסטיקה גלובלית יעילה.</p>
<p>מונעים על ידי מרכז המו״פ ברמה העירונית והמעבדה המתקדמת שלנו, אנו מספקים חדשנות מתמדת ואיכות ללא פשרות. כמיזם הייטק לאומי, הבטיחות והקיימות עומדות בליבת פעילותנו. מוצרינו מאושרים במלואם בתקני CE, SAA, UL, CCC, IP44, IP66 ו-RoHS, בגיבוי מערכת ניהול איכות ISO9001.</p>
<p>עם מגוון רחב של למעלה מ-100,000 פריטים, אנו מציעים גמישות יוצאת דופן באמצעות שירותי OBM, OEM ו-ODM. אנו גאים לשרת לקוחות ברחבי העולם באירופה, ביבשות אמריקה, באוסטרליה, בדרום-מזרח אסיה ובמזרח התיכון. ב-Chengtai, "הלקוח תחילה" הוא יותר מסיסמה — זהו הבסיס לשותפות שלנו.</p>`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  await db.transaction(async (tx) => {
    // ---- Categories ----
    const enCats = await tx
      .select()
      .from(categoryTranslations)
      .where(eq(categoryTranslations.locale, 'en'));
    await tx.delete(categoryTranslations).where(eq(categoryTranslations.locale, 'he'));
    let catN = 0;
    for (const c of enCats) {
      const name = CATEGORY_HE[c.slug];
      if (!name) {
        console.warn(`No Hebrew name for category slug "${c.slug}" — skipped`);
        continue;
      }
      await tx.insert(categoryTranslations).values({
        categoryId: c.categoryId,
        locale: 'he',
        name,
        slug: c.slug, // reuse English slug (clean ASCII URLs)
      });
      catN += 1;
    }

    // ---- FAQs ----
    const enFaqs = await tx
      .select()
      .from(faqTranslations)
      .where(eq(faqTranslations.locale, 'en'));
    await tx.delete(faqTranslations).where(eq(faqTranslations.locale, 'he'));
    let faqN = 0;
    for (const f of enFaqs) {
      const tr = FAQ_HE.find((h) => f.question.toLowerCase().includes(h.match));
      if (!tr) {
        console.warn(`No Hebrew FAQ match for "${f.question}" — skipped`);
        continue;
      }
      await tx.insert(faqTranslations).values({
        faqId: f.faqId,
        locale: 'he',
        question: tr.question,
        answer: tr.answer,
      });
      faqN += 1;
    }

    // ---- About page ----
    const [enAbout] = await tx
      .select()
      .from(aboutPage)
      .where(eq(aboutPage.locale, 'en'))
      .limit(1);
    await tx.delete(aboutPage).where(eq(aboutPage.locale, 'he'));
    await tx.insert(aboutPage).values({
      locale: 'he',
      content: ABOUT_HE_CONTENT,
      factorySize: enAbout?.factorySize ?? '50,000㎡',
      employeeCount: enAbout?.employeeCount ?? '200+',
      annualCapacity: '2,000,000 יחידות',
    });

    console.log(`Inserted he: ${catN} categories, ${faqN} FAQs, 1 about page.`);
  });

  // Also ensure the FAQ faqs table verification (faqs rows are shared; no he rows needed).
  void faqs;

  await client.end();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
