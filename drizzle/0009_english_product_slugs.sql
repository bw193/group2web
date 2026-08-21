-- Move every remaining localized product URL onto its English slug.
--
-- Products translated before `cd8e2bb` ("Use English slugs for new product
-- translations") kept slugs derived from the translated name, e.g.
-- /de/products/runder-led-wandspiegel. Products translated after that commit
-- already share the English slug, so es/pt/fr/it/de were split across two URL
-- styles. This aligns the older rows with the current policy.
--
-- Hebrew is untouched: `0008_hebrew_slug_history.sql` set it to
-- israel-<english-slug> and that prefix is the Hebrew URL scheme.
--
-- Old slugs are copied into `product_slug_history` first so
-- `getProductDetailData()` keeps 308-redirecting the previous URLs.

BEGIN;

DO $$
BEGIN
  -- The English slug we are about to write must not already belong to a
  -- different product in the same locale (product_translations_locale_slug_uniq).
  IF EXISTS (
    SELECT 1
    FROM product_translations t
    JOIN product_translations en
      ON en.product_id = t.product_id AND en.locale = 'en'
    JOIN product_translations other
      ON other.locale = t.locale
     AND other.slug = en.slug
     AND other.product_id <> t.product_id
    WHERE t.locale NOT IN ('en', 'he')
      AND t.slug <> en.slug
  ) THEN
    RAISE EXCEPTION 'target English product slug already used by another product in the same locale';
  END IF;

  -- Nor may it be another product's historical URL, or that product's redirect
  -- would start pointing at this one.
  IF EXISTS (
    SELECT 1
    FROM product_translations t
    JOIN product_translations en
      ON en.product_id = t.product_id AND en.locale = 'en'
    JOIN product_slug_history h
      ON h.locale = t.locale
     AND h.old_slug = en.slug
     AND h.product_id <> t.product_id
    WHERE t.locale NOT IN ('en', 'he')
      AND t.slug <> en.slug
  ) THEN
    RAISE EXCEPTION 'target English product slug is another product historical URL';
  END IF;

  -- The old slug we are about to archive must not already be claimed by a
  -- different product (product_slug_history_locale_old_slug_uniq).
  IF EXISTS (
    SELECT 1
    FROM product_translations t
    JOIN product_translations en
      ON en.product_id = t.product_id AND en.locale = 'en'
    JOIN product_slug_history h
      ON h.locale = t.locale
     AND h.old_slug = t.slug
     AND h.product_id <> t.product_id
    WHERE t.locale NOT IN ('en', 'he')
      AND t.slug <> en.slug
  ) THEN
    RAISE EXCEPTION 'localized product slug is already another product historical URL';
  END IF;
END $$;

INSERT INTO product_slug_history (product_id, locale, old_slug)
SELECT t.product_id, t.locale, t.slug
FROM product_translations t
JOIN product_translations en
  ON en.product_id = t.product_id AND en.locale = 'en'
WHERE t.locale NOT IN ('en', 'he')
  AND t.slug <> en.slug
ON CONFLICT (locale, old_slug) DO NOTHING;

UPDATE product_translations t
SET slug = en.slug
FROM product_translations en
WHERE en.product_id = t.product_id
  AND en.locale = 'en'
  AND t.locale NOT IN ('en', 'he')
  AND t.slug <> en.slug;

COMMIT;
