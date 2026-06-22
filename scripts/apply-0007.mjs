// One-shot applier for drizzle/0007_drop_article_translation_body.sql.
// Drops the deprecated article_translations.body column (IF EXISTS, idempotent).
// Run ONLY after the no-body code is deployed to prod. Run: node scripts/apply-0007.mjs
import { config } from 'dotenv';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config({ path: '.env.local' });
const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'drizzle', '0007_drop_article_translation_body.sql'), 'utf8');

const hasBodyCol = (client) => client`
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'article_translations' AND column_name = 'body'`;

const client = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: 30,
});

try {
  const before = await hasBodyCol(client);
  console.log(`[0007] article_translations.body present before: ${before.length > 0}`);

  console.log('[0007] applying DROP COLUMN ...');
  await client.unsafe(sql);

  const after = await hasBodyCol(client);
  const [bodies] = await client`SELECT count(*)::int AS n FROM article_translation_bodies`;
  const [nn] = await client`SELECT count(body)::int AS n FROM article_translation_bodies`;
  console.log(`[0007] article_translations.body present after: ${after.length > 0}`);
  console.log(`[0007] article_translation_bodies rows: ${bodies.n} (${nn.n} with non-null body)`);
  console.log(after.length === 0 ? '[0007] DONE — column dropped, bodies intact' : '[0007] WARNING — column still present');
} catch (err) {
  console.error('[0007] FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
