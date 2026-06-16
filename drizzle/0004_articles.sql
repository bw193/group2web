-- Insight — editorial journal tables (PostgreSQL / Supabase)
-- Mirrors the products translation pattern: a base `articles` row plus
-- per-locale `article_translations`, and an `article_products` join so each
-- article can feature the products it discusses.
--
-- NOTE: already applied to prod Supabase (pre-RLS variant; the three ALTER
-- statements at the end were run separately). Everything is idempotent, so
-- re-running against any environment is safe.

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
