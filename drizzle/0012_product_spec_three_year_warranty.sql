-- Warranty policy moved to three years, so the per-product warranty specs
-- follow. Before this, 42 spec rows across 7 products still listed two years
-- in the spec table and in each page's Product structured data, contradicting
-- the 3-Year Standard Warranty stated everywhere else (F-02 in the 2026-09-15
-- SEO audit; the FAQ side was fixed in 0011).
--
-- Values are mapped one by one rather than by a numeric REPLACE, so a stray
-- "2" elsewhere in a spec value can never be rewritten. Product 79 keeps its
-- "electronic parts" qualifier and only the duration changes.
-- Run on Supabase (Postgres). Idempotent - safe to re-run.

UPDATE product_specifications
SET spec_value = CASE spec_value
  -- plain durations
  WHEN '2 Years' THEN '3 Years'
  WHEN '2 years' THEN '3 years'
  WHEN '2 años' THEN '3 años'
  WHEN '2 ans' THEN '3 ans'
  WHEN '2 Jahre' THEN '3 Jahre'
  WHEN '2 anos' THEN '3 anos'
  WHEN '2 anni' THEN '3 anni'
  WHEN 'שנתיים' THEN '3 שנים'
  -- duration + the word warranty
  WHEN '2 years warranty' THEN '3 years warranty'
  WHEN '2 años de garantía' THEN '3 años de garantía'
  WHEN 'Garantie de 2 ans' THEN 'Garantie de 3 ans'
  WHEN '2 Jahre Garantie' THEN '3 Jahre Garantie'
  WHEN '2 anos de garantia' THEN '3 anos de garantia'
  WHEN '2 anni di garanzia' THEN '3 anni di garanzia'
  WHEN 'שנתיים אחריות' THEN 'אחריות ל-3 שנים'
  -- electronic-parts wording (product 79)
  WHEN '2 years warranty for the electronic parts' THEN '3 years warranty for the electronic parts'
  WHEN '2 años de garantía para los componentes electrónicos' THEN '3 años de garantía para los componentes electrónicos'
  WHEN 'Garantie de 2 ans pour les composants électroniques' THEN 'Garantie de 3 ans pour les composants électroniques'
  WHEN '2 Jahre Garantie auf elektronische Bauteile' THEN '3 Jahre Garantie auf elektronische Bauteile'
  WHEN '2 anos de garantia para os componentes eletrónicos' THEN '3 anos de garantia para os componentes eletrónicos'
  WHEN '2 anni di garanzia per i componenti elettronici' THEN '3 anni di garanzia per i componenti elettronici'
  WHEN 'שנתיים אחריות לרכיבים אלקטרוניים' THEN 'אחריות ל-3 שנים לרכיבים אלקטרוניים'
  ELSE spec_value
END
-- 'garan' rather than 'garant', so Italian "Garanzia" is matched too.
WHERE spec_key ~* '(warrant|garan|אחריות)';
