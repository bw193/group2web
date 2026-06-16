-- Insight + product hot-path indexes
--
-- Mirrors the SQL applied in Supabase prod (project yleuaykcrrrqdhzmrmoq).
-- All statements are idempotent so this file is safe to run repeatedly and
-- in both prod (already applied) and any fresh DB.
--
-- Motivation: the insight detail page runs concurrent product lookups
-- (related products + their translations + their images) and article-list
-- queries on every render. Without these supporting indexes, under
-- concurrent ISR traffic the queries serialize on sequential scans and
-- approach the app-level connection budget, manifesting as
-- `DbTimeoutError` on Vercel preview/runtime. The defensive UNIQUE
-- indexes also prevent the duplicate-product-slug class of bug (cleaned
-- up earlier in 0003) from re-emerging via CMS edits.

-- Hot-path indexes for product reads on insight detail and product pages.
CREATE INDEX IF NOT EXISTS product_translations_product_locale_idx
  ON public.product_translations (product_id, locale);

CREATE INDEX IF NOT EXISTS product_translations_locale_slug_idx
  ON public.product_translations (locale, slug);

CREATE INDEX IF NOT EXISTS product_images_product_order_idx
  ON public.product_images (product_id, display_order);

CREATE INDEX IF NOT EXISTS product_images_product_primary_idx
  ON public.product_images (product_id, is_primary);

CREATE INDEX IF NOT EXISTS product_specifications_product_locale_idx
  ON public.product_specifications (product_id, locale);

CREATE INDEX IF NOT EXISTS products_category_active_idx
  ON public.products (category_id, is_active, id);

-- Article list-page index: WHERE is_active = true ORDER BY published_at DESC, id DESC.
CREATE INDEX IF NOT EXISTS articles_active_published_idx
  ON public.articles (is_active, published_at DESC, id DESC);

-- Defensive uniques. The cleanup script (drizzle/0003) already removed
-- the existing duplicates; these enforce that the CMS can't reintroduce
-- them. Postgres will surface a unique-violation that the API layer can
-- translate into a user-facing "slug already in use" error.
CREATE UNIQUE INDEX IF NOT EXISTS product_translations_locale_slug_uniq
  ON public.product_translations (locale, slug);

CREATE UNIQUE INDEX IF NOT EXISTS product_translations_product_locale_uniq
  ON public.product_translations (product_id, locale);
