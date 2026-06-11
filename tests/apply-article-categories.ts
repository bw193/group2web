// Applies drizzle/0005_article_categories.sql (idempotent DDL + seed) and
// prints the resulting categories. Run with:
//   npx tsx tests/apply-article-categories.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { readFileSync } from 'fs';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const sql = postgres(url, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
  });

  try {
    const ddl = readFileSync('drizzle/0005_article_categories.sql', 'utf8');
    await sql.unsafe(ddl);
    console.log('Migration applied.');

    const cats = await sql`
      SELECT c.key, c.display_order, count(t.id)::int AS translations
      FROM article_categories c
      LEFT JOIN article_category_translations t ON t.category_id = c.id
      GROUP BY c.id ORDER BY c.display_order, c.id`;
    console.log('CATEGORIES:', JSON.stringify(cats));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error('FAILED:', e);
    process.exit(1);
  },
);
