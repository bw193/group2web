-- Insight article categories — CMS-managed (PostgreSQL / Supabase)
-- `article_categories.key` is the stable token that `articles.category`
-- already stores (text), so the existing articles keep working unchanged.
-- Display names are per-locale with English fallback in the app layer.
-- Idempotent throughout: safe to re-run on any environment.

CREATE TABLE IF NOT EXISTS article_categories (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_category_translations (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES article_categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS article_category_translations_cat_locale_uniq
  ON article_category_translations (category_id, locale);
CREATE INDEX IF NOT EXISTS article_category_translations_locale_idx
  ON article_category_translations (locale);

-- Same data-API posture as the other article tables: deny-by-default RLS;
-- the app reads/writes via the table-owner connection which bypasses it.
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_category_translations ENABLE ROW LEVEL SECURITY;

-- Seed the four categories the existing articles already reference, with the
-- localized labels previously hard-coded in the i18n message files.
INSERT INTO article_categories (key, display_order) VALUES
  ('design', 0),
  ('craft', 1),
  ('projects', 2),
  ('sourcing', 3)
ON CONFLICT (key) DO NOTHING;

INSERT INTO article_category_translations (category_id, locale, name)
SELECT c.id, v.locale, v.name
FROM (VALUES
  ('design',   'en', 'Design'),
  ('design',   'es', 'Diseño'),
  ('design',   'pt', 'Design'),
  ('design',   'fr', 'Design'),
  ('design',   'it', 'Design'),
  ('design',   'de', 'Design'),
  ('design',   'he', 'עיצוב'),
  ('craft',    'en', 'Craft'),
  ('craft',    'es', 'Oficio'),
  ('craft',    'pt', 'Ofício'),
  ('craft',    'fr', 'Savoir-faire'),
  ('craft',    'it', 'Mestiere'),
  ('craft',    'de', 'Handwerk'),
  ('craft',    'he', 'אומנות'),
  ('projects', 'en', 'Projects'),
  ('projects', 'es', 'Proyectos'),
  ('projects', 'pt', 'Projetos'),
  ('projects', 'fr', 'Projets'),
  ('projects', 'it', 'Progetti'),
  ('projects', 'de', 'Projekte'),
  ('projects', 'he', 'פרויקטים'),
  ('sourcing', 'en', 'Sourcing'),
  ('sourcing', 'es', 'Abastecimiento'),
  ('sourcing', 'pt', 'Sourcing'),
  ('sourcing', 'fr', 'Sourcing'),
  ('sourcing', 'it', 'Sourcing'),
  ('sourcing', 'de', 'Beschaffung'),
  ('sourcing', 'he', 'רכש')
) AS v(key, locale, name)
JOIN article_categories c ON c.key = v.key
ON CONFLICT (category_id, locale) DO NOTHING;
