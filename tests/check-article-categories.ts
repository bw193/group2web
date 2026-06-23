import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import postgres from 'postgres';
async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false }, prepare: false, max: 1, connect_timeout: 10, idle_timeout: 5 });
  try {
    const cats = await sql`SELECT id, key, display_order FROM article_categories ORDER BY display_order, id`;
    console.log('article_categories:'); for (const c of cats) console.log(' ', c);
    const trans = await sql`SELECT category_id, locale, name FROM article_category_translations ORDER BY category_id, locale`;
    console.log('article_category_translations:'); for (const t of trans) console.log(' ', t);
    const deks = await sql`SELECT article_id, locale, length(dek) AS dek_len, left(dek,80) AS preview FROM article_translations WHERE locale='en' ORDER BY article_id`;
    console.log('EN deks (article_id, len, preview):'); for (const d of deks) console.log(' ', d);
  } finally { await sql.end({ timeout: 5 }); }
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
