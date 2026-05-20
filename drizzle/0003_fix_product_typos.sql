-- Fix product name/slug typos flagged in the 2026-05-19 SEO audit.
-- Run on Supabase (Postgres). Idempotent — safe to re-run.

-- 1. "Miirror" / "miirror" -> "Mirror" / "mirror"
--    Slug example: asymmetrical-led-miirror -> asymmetrical-led-mirror
UPDATE product_translations
SET name = REPLACE(name, 'Miirror', 'Mirror')
WHERE name LIKE '%Miirror%';

UPDATE product_translations
SET name = REPLACE(name, 'miirror', 'mirror')
WHERE name LIKE '%miirror%';

UPDATE product_translations
SET slug = REPLACE(slug, 'miirror', 'mirror')
WHERE slug LIKE '%miirror%';

-- 2. "Mirorr" / "mirorr" -> "Mirror" / "mirror"
--    Name example: PS Full Length Mirorr -> PS Full Length Mirror
UPDATE product_translations
SET name = REPLACE(name, 'Mirorr', 'Mirror')
WHERE name LIKE '%Mirorr%';

UPDATE product_translations
SET name = REPLACE(name, 'mirorr', 'mirror')
WHERE name LIKE '%mirorr%';

UPDATE product_translations
SET slug = REPLACE(slug, 'mirorr', 'mirror')
WHERE slug LIKE '%mirorr%';

-- 3. "Silm" / "silm" -> "Slim" / "slim"
--    Name example: Silm Framed Bathroom Mirror -> Slim Framed Bathroom Mirror
UPDATE product_translations
SET name = REPLACE(name, 'Silm', 'Slim')
WHERE name LIKE '%Silm%';

UPDATE product_translations
SET name = REPLACE(name, 'silm', 'slim')
WHERE name LIKE '%silm%';

UPDATE product_translations
SET slug = REPLACE(slug, 'silm', 'slim')
WHERE slug LIKE '%silm%';
