// One-shot applier for drizzle/0004_about_gallery_caption.sql.
// Uses the same pool config as runtime (Supabase transaction pooler, prepare=false).
// Idempotent — safe to re-run.
import { config } from 'dotenv';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'drizzle', '0004_about_gallery_caption.sql'), 'utf8');

const client = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: 30,
});

try {
  console.log('[migration] Applying 0004_about_gallery_caption.sql ...');
  await client.unsafe(sql);
  const verify = await client`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'about_gallery'
    ORDER BY ordinal_position
  `;
  console.log('[migration] about_gallery columns:');
  for (const c of verify) console.log(`  - ${c.column_name} :: ${c.data_type} (nullable=${c.is_nullable})`);
  console.log('[migration] DONE');
} catch (err) {
  console.error('[migration] FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
