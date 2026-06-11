// Isolates the three queries the /api/article-categories GET runs, both as
// raw SQL and through drizzle (the app's exact code path). Read-only.
// Run: npx tsx tests/diag-categories-route-queries.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql as dsql } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

async function timed(label: string, fn: () => Promise<unknown>) {
  const t0 = Date.now();
  try {
    const r = await Promise.race([
      fn(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('LOCAL-TIMEOUT 12s')), 12000)),
    ]);
    const n = Array.isArray(r) ? r.length : '?';
    console.log(`${label}: OK in ${Date.now() - t0}ms (rows: ${n})`);
  } catch (e) {
    console.log(`${label}: FAIL in ${Date.now() - t0}ms — ${(e as Error).message}`);
  }
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, {
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 3,
    connect_timeout: 10,
    idle_timeout: 10,
  });
  const db = drizzle(client, { schema });

  await timed('raw: select 1', () => client`select 1`);
  await timed('raw: categories', () => client`select * from article_categories order by display_order, id`);
  await timed('raw: category translations', () => client`select * from article_category_translations`);
  await timed('raw: count group by', () => client`select category, count(*)::int as n from articles group by category`);

  await timed('drizzle: categories', () =>
    db.select().from(schema.articleCategories).orderBy(schema.articleCategories.displayOrder, schema.articleCategories.id),
  );
  await timed('drizzle: category translations', () => db.select().from(schema.articleCategoryTranslations));
  await timed('drizzle: count group by', () =>
    db
      .select({ category: schema.articles.category, n: dsql<number>`count(*)::int` })
      .from(schema.articles)
      .groupBy(schema.articles.category),
  );

  await timed('drizzle: all three in Promise.all', () =>
    Promise.all([
      db.select().from(schema.articleCategories).orderBy(schema.articleCategories.displayOrder, schema.articleCategories.id),
      db.select().from(schema.articleCategoryTranslations),
      db
        .select({ category: schema.articles.category, n: dsql<number>`count(*)::int` })
        .from(schema.articles)
        .groupBy(schema.articles.category),
    ]),
  );

  await client.end({ timeout: 5 });
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error('FAILED:', e);
    process.exit(1);
  },
);
