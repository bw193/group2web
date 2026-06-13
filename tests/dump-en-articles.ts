// Read-only dump of every active English article's translation, used to
// generate per-locale translation files. Writes tests/articles-en.json.
//   npx tsx tests/dump-en-articles.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import { writeFileSync } from 'fs';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
  });
  try {
    const rows = await sql`
      SELECT a.id AS article_id, a.category, a.read_minutes, a.is_featured,
             a.is_active, a.published_at,
             at.slug, at.title, at.dek, at.body, at.author
      FROM articles a
      JOIN article_translations at ON at.article_id = a.id AND at.locale = 'en'
      WHERE a.is_active = true
      ORDER BY a.published_at DESC, a.id DESC
    `;
    writeFileSync('tests/articles-en.json', JSON.stringify(rows, null, 2));
    console.log(`Wrote ${rows.length} articles to tests/articles-en.json`);
    for (const r of rows) {
      console.log(`  ${(r as any).slug}  (id=${(r as any).article_id})  ${(((r as any).body ?? '') as string).length} chars body`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
