BEGIN;

CREATE TABLE IF NOT EXISTS product_slug_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  old_slug TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS article_slug_history (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  old_slug TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_slug_history_locale_old_slug_uniq
  ON product_slug_history (locale, old_slug);
CREATE INDEX IF NOT EXISTS product_slug_history_product_id_idx
  ON product_slug_history (product_id);

CREATE UNIQUE INDEX IF NOT EXISTS article_slug_history_locale_old_slug_uniq
  ON article_slug_history (locale, old_slug);
CREATE INDEX IF NOT EXISTS article_slug_history_article_id_idx
  ON article_slug_history (article_id);

ALTER TABLE product_slug_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_slug_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    WITH product_targets AS (
      SELECT he.product_id, 'israel-' || en.slug AS new_slug
      FROM product_translations he
      JOIN product_translations en ON en.product_id = he.product_id AND en.locale = 'en'
      WHERE he.locale = 'he'
    )
    SELECT 1
    FROM product_targets a
    JOIN product_targets b ON b.new_slug = a.new_slug AND b.product_id <> a.product_id
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Hebrew product Israel slug collision detected';
  END IF;

  IF EXISTS (
    WITH article_targets AS (
      SELECT he.article_id, 'israel-' || en.slug AS new_slug
      FROM article_translations he
      JOIN article_translations en ON en.article_id = he.article_id AND en.locale = 'en'
      WHERE he.locale = 'he'
    )
    SELECT 1
    FROM article_targets a
    JOIN article_targets b ON b.new_slug = a.new_slug AND b.article_id <> a.article_id
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Hebrew article Israel slug collision detected';
  END IF;
END $$;

WITH product_targets AS (
  SELECT
    he.product_id,
    he.slug AS old_he_slug,
    en.slug AS english_slug,
    'israel-' || en.slug AS new_he_slug
  FROM product_translations he
  JOIN product_translations en ON en.product_id = he.product_id AND en.locale = 'en'
  WHERE he.locale = 'he'
)
INSERT INTO product_slug_history (product_id, locale, old_slug)
SELECT product_id, 'he', old_he_slug
FROM product_targets
WHERE old_he_slug <> new_he_slug
ON CONFLICT (locale, old_slug) DO NOTHING;

WITH product_targets AS (
  SELECT
    he.product_id,
    en.slug AS english_slug,
    'israel-' || en.slug AS new_he_slug
  FROM product_translations he
  JOIN product_translations en ON en.product_id = he.product_id AND en.locale = 'en'
  WHERE he.locale = 'he'
)
INSERT INTO product_slug_history (product_id, locale, old_slug)
SELECT product_id, 'he', english_slug
FROM product_targets
WHERE english_slug <> new_he_slug
ON CONFLICT (locale, old_slug) DO NOTHING;

WITH product_targets AS (
  SELECT
    he.product_id,
    'israel-' || en.slug AS new_he_slug
  FROM product_translations he
  JOIN product_translations en ON en.product_id = he.product_id AND en.locale = 'en'
  WHERE he.locale = 'he'
)
UPDATE product_translations he
SET slug = product_targets.new_he_slug
FROM product_targets
WHERE he.product_id = product_targets.product_id
  AND he.locale = 'he'
  AND he.slug <> product_targets.new_he_slug;

WITH article_targets AS (
  SELECT
    he.article_id,
    he.slug AS old_he_slug,
    en.slug AS english_slug,
    'israel-' || en.slug AS new_he_slug
  FROM article_translations he
  JOIN article_translations en ON en.article_id = he.article_id AND en.locale = 'en'
  WHERE he.locale = 'he'
)
INSERT INTO article_slug_history (article_id, locale, old_slug)
SELECT article_id, 'he', old_he_slug
FROM article_targets
WHERE old_he_slug <> new_he_slug
ON CONFLICT (locale, old_slug) DO NOTHING;

WITH article_targets AS (
  SELECT
    he.article_id,
    en.slug AS english_slug,
    'israel-' || en.slug AS new_he_slug
  FROM article_translations he
  JOIN article_translations en ON en.article_id = he.article_id AND en.locale = 'en'
  WHERE he.locale = 'he'
)
INSERT INTO article_slug_history (article_id, locale, old_slug)
SELECT article_id, 'he', english_slug
FROM article_targets
WHERE english_slug <> new_he_slug
ON CONFLICT (locale, old_slug) DO NOTHING;

WITH article_targets AS (
  SELECT
    he.article_id,
    'israel-' || en.slug AS new_he_slug
  FROM article_translations he
  JOIN article_translations en ON en.article_id = he.article_id AND en.locale = 'en'
  WHERE he.locale = 'he'
)
UPDATE article_translations he
SET slug = article_targets.new_he_slug
FROM article_targets
WHERE he.article_id = article_targets.article_id
  AND he.locale = 'he'
  AND he.slug <> article_targets.new_he_slug;

COMMIT;
