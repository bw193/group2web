// Read-only: dump which locales each article already has rows for.
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
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
      SELECT a.id, a.is_active,
             coalesce(en.slug, '(no en)') AS en_slug,
             string_agg(at.locale, ',' ORDER BY at.locale) AS locales
      FROM articles a
      LEFT JOIN article_translations en ON en.article_id = a.id AND en.locale = 'en'
      LEFT JOIN article_translations at ON at.article_id = a.id
      WHERE a.is_active = true
      GROUP BY a.id, a.is_active, en.slug
      ORDER BY a.id
    `;
    for (const r of rows) {
      console.log(`#${(r as any).id}  ${(r as any).en_slug}\n      locales: ${(r as any).locales}`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
