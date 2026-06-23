// One-shot: dump a single article's EN translation + body to stdout.
//   npx tsx tests/dump-one-article.ts <article_id>
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import postgres from 'postgres';

async function main() {
  const id = Number(process.argv[2]);
  if (!id) {
    console.error('Usage: npx tsx tests/dump-one-article.ts <article_id>');
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL!, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
  });
  try {
    const [article] = await sql`
      SELECT id, category, cover_image_url, thumbnail_url, read_minutes,
             is_featured, is_active, display_order, published_at, created_at
      FROM articles WHERE id = ${id} LIMIT 1`;
    const [trans] = await sql`
      SELECT id, locale, slug, title, dek, author
      FROM article_translations
      WHERE article_id = ${id} AND locale = 'en' LIMIT 1`;
    const [bodyRow] = trans
      ? await sql`
          SELECT body FROM article_translation_bodies
          WHERE article_translation_id = ${trans.id} LIMIT 1`
      : [null];
    console.log(JSON.stringify({ article, trans, body: bodyRow?.body ?? null }, null, 2));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
