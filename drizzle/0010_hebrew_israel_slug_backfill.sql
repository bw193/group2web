-- Re-assert the Hebrew slug invariant for products added after
-- `0008_hebrew_slug_history.sql` ran.
--
-- Products 163, 165, 166 and 167 were created through a path that stored the
-- bare English slug on their `he` row, so their Hebrew URL was identical to the
-- English one instead of israel-<english-slug>. That breaks the Hebrew URL
-- scheme in `src/lib/localized-slugs.ts` and makes the Hebrew page
-- indistinguishable from the English one in cross-locale slug lookups.
--
-- Written as a set-based backfill rather than a fix for those four ids so
-- re-running it after any future import restores the invariant.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM product_translations he
    JOIN product_translations en
      ON en.product_id = he.product_id AND en.locale = 'en'
    JOIN product_translations other
      ON other.locale = 'he'
     AND other.slug = 'israel-' || en.slug
     AND other.product_id <> he.product_id
    WHERE he.locale = 'he'
      AND he.slug <> 'israel-' || en.slug
  ) THEN
    RAISE EXCEPTION 'target Hebrew Israel slug already used by another product';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM product_translations he
    JOIN product_translations en
      ON en.product_id = he.product_id AND en.locale = 'en'
    JOIN product_slug_history h
      ON h.locale = 'he'
     AND h.old_slug IN (he.slug, 'israel-' || en.slug)
     AND h.product_id <> he.product_id
    WHERE he.locale = 'he'
      AND he.slug <> 'israel-' || en.slug
  ) THEN
    RAISE EXCEPTION 'Hebrew slug rewrite collides with another product historical URL';
  END IF;
END $$;

INSERT INTO product_slug_history (product_id, locale, old_slug)
SELECT he.product_id, 'he', he.slug
FROM product_translations he
JOIN product_translations en
  ON en.product_id = he.product_id AND en.locale = 'en'
WHERE he.locale = 'he'
  AND he.slug <> 'israel-' || en.slug
ON CONFLICT (locale, old_slug) DO NOTHING;

UPDATE product_translations he
SET slug = 'israel-' || en.slug
FROM product_translations en
WHERE en.product_id = he.product_id
  AND en.locale = 'en'
  AND he.locale = 'he'
  AND he.slug <> 'israel-' || en.slug;

COMMIT;
