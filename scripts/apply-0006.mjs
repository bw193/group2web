// One-shot applier for drizzle/0006_article_translation_bodies.sql.
// Same pool config as runtime. Idempotent — safe to re-run.
import { config } from 'dotenv';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config({ path: '.env.local' });
const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'drizzle', '0006_article_translation_bodies.sql'), 'utf8');

const client = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: 30,
});

try {
  console.log('[0006] applying ...');
  await client.unsafe(sql);
  const bodies = await client`SELECT count(*)::int n FROM article_translation_bodies`;
  const trans = await client`SELECT count(*)::int n FROM article_translations WHERE body IS NOT NULL`;
  console.log(`[0006] article_translation_bodies rows: ${bodies[0].n}`);
  console.log(`[0006] article_translations with body (source): ${trans[0].n}`);
  const idx = await client`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname IN (
        'article_products_article_order_idx',
        'article_translations_article_locale_idx',
        'article_translations_locale_slug_idx',
        'articles_active_published_idx'
      )
    ORDER BY indexname`;
  console.log('[0006] indexes present:', idx.map((r) => r.indexname).join(', '));
  console.log('[0006] DONE');
} catch (err) {
  console.error('[0006] FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
