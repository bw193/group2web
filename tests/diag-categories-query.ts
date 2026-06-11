// Read-only diagnostic: how does the pooler/client behave when selecting from
// the not-yet-created article_categories table? Times each step.
// Run with: npx tsx tests/diag-categories-query.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });
import postgres from 'postgres';

async function timed(label: string, fn: () => Promise<unknown>) {
  const t0 = Date.now();
  try {
    await fn();
    console.log(`${label}: OK in ${Date.now() - t0}ms`);
  } catch (e) {
    console.log(`${label}: ERROR in ${Date.now() - t0}ms — ${(e as Error).message}`);
  }
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 3,
    connect_timeout: 10,
    idle_timeout: 20,
  });

  await timed('select 1 (warmup)', () => sql`select 1`);
  await timed('select missing table', () => sql`select * from article_categories order by display_order`);
  await timed('select 1 (after error)', () => sql`select 1`);
  await timed('articles count', () => sql`select count(*) from articles`);
  // Same shape as the page: a failing query racing good ones on the pool.
  const t0 = Date.now();
  const results = await Promise.allSettled([
    sql`select * from article_categories`,
    sql`select count(*) from articles`,
    sql`select count(*) from article_translations`,
  ]);
  console.log(
    `Promise.all mix: ${Date.now() - t0}ms —`,
    results.map((r) => r.status).join(', '),
  );

  await sql.end({ timeout: 5 });
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error('FAILED:', e);
    process.exit(1);
  },
);
