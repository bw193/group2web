// Inserts/updates Insight article translations for ONE locale from a JSON
// file - the workflow for localizing articles after generating the text
// (e.g. with a cheaper model). Idempotent per (article, locale): re-running
// replaces that locale's row; other locales are never touched.
//
//   npx tsx tests/insert-article-translations.ts <locale> <path/to/file.json>
//
// JSON format - an array, one object per article, matched by its ENGLISH slug:
// [
//   {
//     "enSlug": "the-return-of-the-arched-mirror",   // required: which article
//     "title": "Le retour du miroir arque",          // required
//     "slug": "le-retour-du-miroir-arque",           // ignored: URL comes from EN slug
//     "dek": "Summary shown in the list",            // optional
//     "body": "<p>Body HTML</p><h3>Heading</h3>",    // optional: same HTML tags as EN bodies
//     "author": "Studio Notes"                        // optional
//   }
// ]
//
// Once rows exist for a locale, everything follows automatically: the page
// renders in that language (no more noindex fallback), hreflang lists it,
// the sitemap gains the URLs, and the next build prerenders them. ISR picks
// the content up within ~10 minutes on prod, or immediately on redeploy.
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import { readFileSync } from 'fs';
import postgres from 'postgres';
import { resolveArticleTranslationSlug } from '../src/lib/articles';

const SITE_LOCALES = ['en', 'es', 'pt', 'fr', 'it', 'de', 'he'];

interface Item {
  enSlug: string;
  title: string;
  slug?: string;
  dek?: string;
  body?: string;
  author?: string;
}

async function main() {
  const [locale, jsonPath] = process.argv.slice(2);
  if (!locale || !jsonPath) {
    console.error('Usage: npx tsx tests/insert-article-translations.ts <locale> <file.json>');
    process.exit(1);
  }
  if (!SITE_LOCALES.includes(locale) || locale === 'en') {
    console.error(`locale must be one of: ${SITE_LOCALES.filter((l) => l !== 'en').join(', ')}`);
    process.exit(1);
  }

  const items: Item[] = JSON.parse(readFileSync(jsonPath, 'utf8'));
  if (!Array.isArray(items) || items.length === 0) {
    console.error('JSON must be a non-empty array');
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
    for (const item of items) {
      if (!item.enSlug || !item.title?.trim()) {
        console.warn(`SKIP (missing enSlug or title): ${JSON.stringify(item).slice(0, 80)}`);
        continue;
      }
      const [en] = await sql`
        SELECT article_id FROM article_translations WHERE locale = 'en' AND slug = ${item.enSlug} LIMIT 1`;
      if (!en) {
        console.warn(`SKIP (no article with EN slug "${item.enSlug}")`);
        continue;
      }
      const articleId = en.article_id;
      const slug = resolveArticleTranslationSlug({ locale, englishSlug: item.enSlug });

      // (locale, slug) is the routing key - refuse a slug another article owns.
      const [clash] = await sql`
        SELECT article_id FROM article_translations
        WHERE locale = ${locale} AND slug = ${slug} AND article_id <> ${articleId} LIMIT 1`;
      if (clash) {
        console.warn(`SKIP "${item.enSlug}": slug "${slug}" already used by article ${clash.article_id} in ${locale}`);
        continue;
      }
      const [historyClash] = await sql`
        SELECT article_id FROM article_slug_history
        WHERE locale = ${locale} AND old_slug = ${slug} AND article_id <> ${articleId} LIMIT 1`;
      if (historyClash) {
        console.warn(`SKIP "${item.enSlug}": slug "${slug}" is historical URL for article ${historyClash.article_id} in ${locale}`);
        continue;
      }

      const [existing] = await sql`
        SELECT id, slug FROM article_translations
        WHERE article_id = ${articleId} AND locale = ${locale}
        LIMIT 1`;
      if (existing && existing.slug !== slug) {
        await sql`
          INSERT INTO article_slug_history (article_id, locale, old_slug)
          VALUES (${articleId}, ${locale}, ${existing.slug})
          ON CONFLICT (locale, old_slug) DO NOTHING`;
      }

      const [trans] = await sql`
        INSERT INTO article_translations (article_id, locale, slug, title, dek, author)
        VALUES (${articleId}, ${locale}, ${slug}, ${item.title.trim()}, ${item.dek ?? null}, ${item.author ?? null})
        ON CONFLICT (article_id, locale)
        DO UPDATE SET slug = EXCLUDED.slug, title = EXCLUDED.title, dek = EXCLUDED.dek,
                      author = EXCLUDED.author
        RETURNING id`;
      // Body lives only in article_translation_bodies (legacy column dropped in 0007).
      await sql`
        INSERT INTO article_translation_bodies (article_translation_id, body)
        VALUES (${trans.id}, ${item.body ?? null})
        ON CONFLICT (article_translation_id) DO UPDATE SET body = EXCLUDED.body`;
      console.log(`OK ${locale}/${slug}  (article ${articleId} from ${item.enSlug})`);
    }

    const [count] = await sql`
      SELECT count(*)::int AS n FROM article_translations WHERE locale = ${locale}`;
    console.log(`Done - ${count.n} ${locale} translation(s) now in the database.`);
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
