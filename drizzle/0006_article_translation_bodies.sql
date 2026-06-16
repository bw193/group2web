-- Stage 1 of splitting heavy article HTML out of article_translations.
--
-- article_translations becomes a light, product_translations-style routing/SEO
-- table; the large `body` HTML moves to article_translation_bodies so the
-- list / index / metadata / more-stories paths never load it during static
-- generation. This migration is additive + backfill only — it intentionally
-- does NOT drop article_translations.body (that happens in a later migration
-- once the body-split code is deployed). Idempotent / safe to re-run.

CREATE TABLE IF NOT EXISTS article_translation_bodies (
  article_translation_id INTEGER PRIMARY KEY
    REFERENCES article_translations(id) ON DELETE CASCADE,
  body TEXT
);

-- Backfill existing bodies.
INSERT INTO article_translation_bodies (article_translation_id, body)
SELECT id, body
FROM article_translations
WHERE body IS NOT NULL
ON CONFLICT (article_translation_id) DO UPDATE SET body = EXCLUDED.body;

-- Indexes for the product-like loader paths.
CREATE INDEX IF NOT EXISTS article_products_article_order_idx
  ON public.article_products (article_id, display_order);

CREATE INDEX IF NOT EXISTS article_translations_article_locale_idx
  ON public.article_translations (article_id, locale);

CREATE INDEX IF NOT EXISTS article_translations_locale_slug_idx
  ON public.article_translations (locale, slug);

CREATE INDEX IF NOT EXISTS articles_active_published_idx
  ON public.articles (is_active, published_at DESC, id DESC);
