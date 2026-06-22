// Read-only full-picture survey of the prod Supabase DB. SELECT/catalog only —
// no writes. Same pooler config as runtime. Run: node scripts/db-overview.mjs
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max: 1,
  idle_timeout: 5,
  connect_timeout: 30,
});

const EXPECTED_0006_INDEXES = [
  'article_products_article_order_idx',
  'article_translations_article_locale_idx',
  'article_translations_locale_slug_idx',
  'articles_active_published_idx',
];

try {
  // 1) Every base table in public: RLS flag + index count + exact row count.
  const tables = await sql`
    SELECT c.relname AS name, c.relrowsecurity AS rls,
           (SELECT count(*) FROM pg_index i WHERE i.indrelid = c.oid) AS idx
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname`;

  console.log('\n=== PUBLIC TABLES (rows | RLS | #indexes) ===');
  for (const t of tables) {
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM ${sql(t.name)}`;
    const insight = /^article/.test(t.name) ? '  ← insight' : '';
    console.log(
      `${String(n).padStart(6)}  ${t.rls ? 'RLS ' : '----'}  ${String(t.idx).padStart(2)}idx  ${t.name}${insight}`,
    );
  }

  // 2) Is migration 0006 applied?
  console.log('\n=== MIGRATION 0006 STATE ===');
  const [{ bt }] = await sql`SELECT to_regclass('public.article_translation_bodies') AS bt`;
  if (bt) {
    const [{ rows }] = await sql`SELECT count(*)::int AS rows FROM article_translation_bodies`;
    const [{ nn }] = await sql`SELECT count(body)::int AS nn FROM article_translation_bodies`;
    console.log(`article_translation_bodies: EXISTS — ${rows} rows (${nn} with non-null body)`);
  } else {
    console.log('article_translation_bodies: DOES NOT EXIST → 0006 not applied yet');
  }
  const idxRows = await sql`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = ANY(${EXPECTED_0006_INDEXES})`;
  const present = new Set(idxRows.map((r) => r.indexname));
  for (const ix of EXPECTED_0006_INDEXES) {
    console.log(`  index ${present.has(ix) ? '✓' : '✗ MISSING'}  ${ix}`);
  }

  // 3) article_translations: per-locale counts + how many carry a body.
  console.log('\n=== article_translations BY LOCALE (rows | with body) ===');
  const byLoc = await sql`
    SELECT locale, count(*)::int AS n, count(body)::int AS with_body
    FROM article_translations GROUP BY locale ORDER BY locale`;
  for (const r of byLoc) {
    console.log(`  ${r.locale.padEnd(3)}  ${String(r.n).padStart(4)}  ${String(r.with_body).padStart(4)} with body`);
  }
  const [{ a }] = await sql`SELECT count(*)::int AS a FROM articles`;
  const [{ act }] = await sql`SELECT count(*)::int AS act FROM articles WHERE is_active = true`;
  console.log(`  articles total: ${a}  (active: ${act})`);

  // 4) All indexes on the insight tables (pre/post 0006 picture).
  console.log('\n=== INDEXES ON article* TABLES ===');
  const allIdx = await sql`
    SELECT tablename, indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename LIKE 'article%'
    ORDER BY tablename, indexname`;
  for (const r of allIdx) console.log(`  ${r.tablename.padEnd(28)} ${r.indexname}`);

  console.log('\nDONE (read-only).');
} catch (err) {
  console.error('FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
