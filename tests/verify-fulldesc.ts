import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  const r = await db.execute(sql`
    SELECT locale, length(full_description) AS len, substring(full_description, 1, 220) AS preview
    FROM product_translations
    WHERE product_id = 75 AND locale IN ('en','fr','it','de','es','pt')
    ORDER BY locale
  `);
  for (const row of r as any[]) {
    console.log(`${row.locale}\tlen=${row.len}\t${row.preview}`);
  }
  await client.end();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
