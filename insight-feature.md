# Insight (Editorial Journal / Blog) — Database Schema Reference

_Last updated: 2026-06-08_

This file exists on `main` to record **what was changed in the prod Supabase
database** for the Insight (blog) feature, because the schema was applied to
production while the application code was not merged into `main`. A future
Insight page redesign should consult this doc before reinventing the schema
(or before re-applying the migration to a fresh environment).

---

## ⚠️ Status & drift warning (read first)

> **UPDATE 2026-06-10 — drift resolved.** The Insight feature was **completely
> rebuilt on `main`** (new design; public pages + CMS + APIs + CMS-managed
> categories). The backup branch is historical reference only — do not port
> from it. New since this doc was written: `article_categories` +
> `article_category_translations` (see `drizzle/0005_article_categories.sql`,
> applied to prod), and RLS was later **disabled** on all five article tables
> by owner preference (the app reads via the owner connection either way).
> Locale translations for article content are still EN-only; insert them with
> `npx tsx tests/insert-article-translations.ts <locale> <file.json>`.
> The schema reference below remains accurate for the three original tables.

- **Prod Supabase already has the schema + data.** The owner applied
  `drizzle/0004_articles.sql` (the **pre-RLS** variant) and seeded **7 English
  articles** via `tests/seed-articles.ts`.
- **The application code lives only on branch `backup/local-wip-2026-06-05`**
  (HEAD `6144325`, code commit `3d2f59f`) — **not on `main`**. On 2026-06-05
  `main` was reset to `origin/main`, which removed the Insight source and the
  article-table definitions from `src/lib/db/schema.ts`, and removed
  `drizzle/0004_articles.sql`.
- **Drift:** production Postgres contains `articles`, `article_translations`,
  `article_products` (+ 7 articles), but `main`'s code does not reference them.
- **Nothing is deployed and nothing was pushed.** The live site does not show
  Insight (its routes don't exist on `main`).
- **Re-applying is safe.** The DDL uses `CREATE TABLE IF NOT EXISTS` and
  `CREATE INDEX IF NOT EXISTS` throughout, so running it again is a no-op on
  prod. But verify with the cheatsheet below before assuming.

---

## The three tables

### `articles` — one row per article
| column | type | constraints / default |
|---|---|---|
| `id` | serial | PK |
| `category` | text | NOT NULL, default `'design'` (stable key: `design \| craft \| projects \| sourcing`; label localized via `insight.category.*`) |
| `cover_image_url` | text | nullable (16:8 hero + thumbnail source) |
| `thumbnail_url` | text | nullable (optional 4:3 list thumb; falls back to cover) |
| `read_minutes` | integer | NOT NULL, default `5` |
| `is_featured` | boolean | NOT NULL, default `false` |
| `is_active` | boolean | NOT NULL, default `true` |
| `display_order` | integer | NOT NULL, default `0` |
| `published_at` | timestamp | NOT NULL, default `NOW()` |
| `created_by` | integer | FK → `users(id)` |
| `created_at` | timestamp | NOT NULL, default `NOW()` |
| `updated_at` | timestamp | NOT NULL, default `NOW()` |

### `article_translations` — one row per (article × locale)
| column | type | constraints |
|---|---|---|
| `id` | serial | PK |
| `article_id` | integer | NOT NULL, FK → `articles(id)` ON DELETE CASCADE |
| `locale` | text | NOT NULL |
| `slug` | text | NOT NULL |
| `title` | text | NOT NULL |
| `dek` | text | nullable (summary) |
| `body` | text | nullable (HTML: `<p> <h3> <blockquote><cite>`) |
| `author` | text | nullable (byline) |

### `article_products` — article → catalog product join
| column | type | constraints |
|---|---|---|
| `id` | serial | PK |
| `article_id` | integer | NOT NULL, FK → `articles(id)` ON DELETE CASCADE |
| `product_id` | integer | NOT NULL, FK → `products(id)` ON DELETE CASCADE |
| `display_order` | integer | NOT NULL, default `0` |

---

## Indexes & uniqueness

- `article_translations_article_idx (article_id)`
- `article_translations_locale_idx (locale)`
- `article_translations_slug_idx (slug)`
- **UNIQUE** `article_translations_article_locale_uniq (article_id, locale)` — one translation per (article, locale)
- **UNIQUE** `article_translations_locale_slug_uniq (locale, slug)` — one slug per locale (routing key)
- `articles_active_idx (is_active)`
- `articles_category_idx (category)`
- `article_products_article_idx (article_id)`
- `article_products_product_idx (product_id)`

The two UNIQUE indexes are the routing keys: a URL like `/{locale}/insight/{slug}`
is resolved via `(locale, slug)`, and `(article_id, locale)` prevents duplicate
translations for the same article in the same language.

---

## Row-Level Security

The committed migration ends with `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` on
all three tables (deny-by-default, no policies). The app reads/writes only via
the direct `postgres` connection (table owner), which bypasses RLS — so no
policies are needed, and drafts stay private from the anon/authenticated
PostgREST data API.

**Prod note:** production received the **pre-RLS** version of this file, so
RLS is likely **not yet enabled** there. Run the cheatsheet `pg_class` query
below to confirm. To finish: run the three `ALTER TABLE … ENABLE ROW LEVEL
SECURITY;` statements (safe, idempotent).

---

## Full DDL

Verbatim copy of `drizzle/0004_articles.sql` from
`backup/local-wip-2026-06-05`. Source of truth — apply this to recreate the
schema on any environment.

```sql
-- Insight — editorial journal tables (PostgreSQL / Supabase)
-- Mirrors the products translation pattern: a base `articles` row plus
-- per-locale `article_translations`, and an `article_products` join so each
-- article can feature the products it discusses.

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'design',
  cover_image_url TEXT,
  thumbnail_url TEXT,
  read_minutes INTEGER NOT NULL DEFAULT 5,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_translations (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  dek TEXT,
  body TEXT,
  author TEXT
);

CREATE TABLE IF NOT EXISTS article_products (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Lookups: by article, by locale, and by slug for routing.
CREATE INDEX IF NOT EXISTS article_translations_article_idx ON article_translations (article_id);
CREATE INDEX IF NOT EXISTS article_translations_locale_idx ON article_translations (locale);
CREATE INDEX IF NOT EXISTS article_translations_slug_idx ON article_translations (slug);

-- One translation per (article, locale); one slug per (locale).
CREATE UNIQUE INDEX IF NOT EXISTS article_translations_article_locale_uniq ON article_translations (article_id, locale);
CREATE UNIQUE INDEX IF NOT EXISTS article_translations_locale_slug_uniq ON article_translations (locale, slug);

CREATE INDEX IF NOT EXISTS articles_active_idx ON articles (is_active);
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles (category);

CREATE INDEX IF NOT EXISTS article_products_article_idx ON article_products (article_id);
CREATE INDEX IF NOT EXISTS article_products_product_idx ON article_products (product_id);

-- Lock these tables from the anon/authenticated data API (PostgREST). The app
-- reads/writes only via the direct Postgres connection (the `postgres` table
-- owner, which bypasses RLS by default), so no policies are needed. Deny-by-
-- default also keeps unpublished article drafts private. Idempotent: enabling
-- RLS when already enabled is a harmless no-op.
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_products ENABLE ROW LEVEL SECURITY;
```

---

## Seed data already in production

`tests/seed-articles.ts` (on the backup branch) inserted **7 English
articles**, each `is_featured = true`, `is_active = true`, `created_by = 1`,
linked to up to 3 catalog products (keyword match, else newest). It's
idempotent — skips any article whose English slug already exists.

| # | slug | category | published | read |
|---|---|---|---|---|
| 1 | `the-quiet-science-of-a-flattering-mirror-light` | design | 2026-05-12 | 6 |
| 2 | `inside-the-coating-line-how-glass-becomes-a-mirror` | craft | 2026-04-22 | 5 |
| 3 | `a-boutique-hotel-in-lisbon-lit-by-240-backlit-mirrors` | projects | 2026-04-08 | 7 |
| 4 | `oem-odm-obm-which-one-actually-fits-your-brand` | sourcing | 2026-03-25 | 8 |
| 5 | `why-we-set-every-mirror-edge-by-hand` | craft | 2026-03-11 | 4 |
| 6 | `specifying-ip-ratings-for-steam-heavy-bathrooms` | sourcing | 2026-02-24 | 6 |
| 7 | `the-return-of-the-arched-mirror` | design | 2026-02-10 | 5 |

Per-locale translations were never inserted in prod. The backup branch has a
helper `tests/insert-article-translations.ts <locale> <jsonPath>` that
slugifies, de-dupes per locale, wipes existing `(locale, article_id)` rows,
and re-inserts — safe to re-run.

---

## Read-only verification cheatsheet

None of these mutate data. Run against prod to confirm the current state
before deciding what (if anything) to redo.

```sql
-- Row counts (expect: articles = 7, translations = 7 if EN only, products varies)
SELECT count(*) AS articles FROM articles;
SELECT count(*) AS translations FROM article_translations;
SELECT count(*) AS article_products FROM article_products;

-- RLS state (relrowsecurity = true means RLS is on)
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('articles', 'article_translations', 'article_products');

-- Locales present in translations (likely just 'en' in prod today)
SELECT locale, count(*) FROM article_translations GROUP BY locale ORDER BY locale;
```

---

## Where the application code lives

Everything below is on `backup/local-wip-2026-06-05` only. None of it is on
`main`. If the redesign wants to start from the existing implementation
rather than from scratch, cherry-pick from there.

- **Drizzle schema additions:** `src/lib/db/schema.ts` → `articles`,
  `articleTranslations`, `articleProducts`
- **Migration file:** `drizzle/0004_articles.sql`
- **Data layer:** `src/lib/insight.ts`
- **API routes:** `src/app/api/articles/route.ts` (list/create),
  `src/app/api/articles/[id]/route.ts` (get/update/delete)
- **Public pages:** `src/app/[locale]/insight/page.tsx` (index),
  `src/app/[locale]/insight/[slug]/page.tsx` (article — SSG+ISR, BlogPosting
  JSON-LD, hreflang, sitemap entries)
- **Public components:** `src/components/public/insight/`
  (`ArticleListRow`, `CategoryFilter`, `MoreFromInsight`)
- **CMS:** `src/app/cms/insight/page.tsx` (list),
  `src/app/cms/insight/[id]/page.tsx` (editor)
- **i18n keys:** `insight.*` in all 7 message files (`en/es/pt/fr/it/de/he`);
  "Insight" nav link in `src/components/public/Header.tsx`
- **Seed scripts:** `tests/seed-articles.ts`,
  `tests/insert-article-translations.ts`
- **Original backup-branch doc:** `insight-feature.md` (the 141-line version
  that this file was distilled from)
