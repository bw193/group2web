// Read-only integrity check: is the split body in sync with the legacy column,
// and are non-EN article bodies real translations (not EN copies)?
import { config } from 'dotenv';
import postgres from 'postgres';
config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }, prepare: false, max: 1, idle_timeout: 5, connect_timeout: 30,
});
try {
  // 1) Drift between article_translations.body and article_translation_bodies.body.
  const drift = await sql`
    SELECT t.id, t.locale, t.slug,
           (t.body IS NULL) AS legacy_null,
           (b.article_translation_id IS NULL) AS no_body_row,
           (t.body IS DISTINCT FROM b.body) AS differs,
           length(t.body) AS legacy_len, length(b.body) AS split_len
    FROM article_translations t
    LEFT JOIN article_translation_bodies b ON b.article_translation_id = t.id
    WHERE t.body IS DISTINCT FROM b.body
    ORDER BY t.locale, t.slug`;
  console.log(`\n=== BODY SYNC: ${drift.length} row(s) where legacy <> split ===`);
  for (const r of drift) {
    console.log(`  id=${r.id} ${r.locale}/${r.slug}  legacy_len=${r.legacy_len} split_len=${r.split_len}` +
      `${r.no_body_row ? '  [NO split row]' : ''}${r.legacy_null ? '  [legacy NULL]' : ''}`);
  }
  if (drift.length === 0) console.log('  (perfectly in sync)');

  // 2) Are non-EN bodies distinct from the same article's EN body?
  console.log('\n=== NON-EN BODIES vs EN (same_as_en = likely English copy) ===');
  const sameEn = await sql`
    SELECT t.locale, count(*)::int AS same_as_en
    FROM article_translations t
    JOIN article_translations e ON e.article_id = t.article_id AND e.locale = 'en'
    WHERE t.locale <> 'en' AND t.body = e.body
    GROUP BY t.locale ORDER BY t.locale`;
  if (sameEn.length === 0) console.log('  (every non-EN body differs from EN — real translations)');
  for (const r of sameEn) console.log(`  ${r.locale}: ${r.same_as_en} article(s) copy the EN body`);

  // 3) Quick per-article × locale title sample so we can eyeball real content.
  console.log('\n=== ARTICLES (en slug | locales present) ===');
  const arts = await sql`
    SELECT a.id,
           max(CASE WHEN t.locale='en' THEN t.slug END) AS en_slug,
           string_agg(DISTINCT t.locale, ',' ORDER BY t.locale) AS locales
    FROM articles a LEFT JOIN article_translations t ON t.article_id = a.id
    GROUP BY a.id ORDER BY a.id`;
  for (const r of arts) console.log(`  #${r.id}  ${String(r.en_slug ?? '(no en)').padEnd(40)} [${r.locales}]`);

  console.log('\nDONE (read-only).');
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
