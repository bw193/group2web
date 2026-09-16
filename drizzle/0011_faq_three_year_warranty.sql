-- Bring the FAQ warranty answer in line with the rest of the site.
-- The homepage/catalog proof points, the About fact file and the in-code FAQ
-- fallbacks all promise a 3-Year Standard Warranty, but faq_translations still
-- said two years in all seven locales, so the FAQ on the homepage and About
-- page contradicted every other page. Flagged as F-02 in the 2026-09-15 SEO
-- audit. Keys off the English question rather than a hard-coded faq_id.
-- Run on Supabase (Postgres). Idempotent - safe to re-run.

WITH warranty AS (
  SELECT faq_id
  FROM faq_translations
  WHERE locale = 'en' AND question ILIKE '%guarantee for the products%'
)
UPDATE faq_translations AS ft
SET answer = CASE ft.locale
  WHEN 'en' THEN 'Yes, we provide a 3-year standard warranty for our products.'
  WHEN 'es' THEN 'Sí, ofrecemos una garantía estándar de 3 años para nuestros productos.'
  WHEN 'pt' THEN 'Sim, oferecemos garantia padrão de 3 anos para nossos produtos.'
  WHEN 'fr' THEN 'Oui, nous offrons une garantie standard de 3 ans sur nos produits.'
  WHEN 'it' THEN 'Sì, offriamo una garanzia standard di 3 anni sui nostri prodotti.'
  WHEN 'de' THEN 'Ja, wir gewähren auf unsere Produkte eine Standardgarantie von 3 Jahren.'
  WHEN 'he' THEN 'כן, אנו מספקים אחריות סטנדרטית ל-3 שנים על מוצרינו.'
  ELSE ft.answer
END
FROM warranty
WHERE ft.faq_id = warranty.faq_id
  AND ft.locale IN ('en', 'es', 'pt', 'fr', 'it', 'de', 'he');
