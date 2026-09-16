-- Warranty policy moved to three years, so the warranty sentences inside the
-- product descriptions follow (0011 fixed the FAQ, 0012 the spec rows).
-- Four products name a warranty period in their long copy: #78, #79, #80 and
-- #141, across en/es/pt/fr/de/he.
--
-- Each replacement is anchored on the exact raw substring, including the
-- surrounding <strong> tags where present, so a "2" anywhere else in the copy
-- (5 mm, IP54, 3 cm, section numbers) can never be rewritten.
-- Run on Supabase (Postgres). Idempotent - safe to re-run.

-- #78 Smart LED mirror: electronic components cover
UPDATE product_translations SET full_description = replace(full_description, '<strong>2-year warranty</strong>', '<strong>3-year warranty</strong>') WHERE product_id = 78 AND locale = 'en';
UPDATE product_translations SET full_description = replace(full_description, '<strong>garantía de 2 años</strong>', '<strong>garantía de 3 años</strong>') WHERE product_id = 78 AND locale = 'es';
UPDATE product_translations SET full_description = replace(full_description, '<strong>2 anos de garantia</strong>', '<strong>3 anos de garantia</strong>') WHERE product_id = 78 AND locale = 'pt';
UPDATE product_translations SET full_description = replace(full_description, '<strong>garantie de 2 ans</strong>', '<strong>garantie de 3 ans</strong>') WHERE product_id = 78 AND locale = 'fr';
UPDATE product_translations SET full_description = replace(full_description, '<strong>2-jährige Garantie</strong>', '<strong>3-jährige Garantie</strong>') WHERE product_id = 78 AND locale = 'de';
UPDATE product_translations SET full_description = replace(full_description, '<strong>אחריות לשנתיים</strong>', '<strong>אחריות ל-3 שנים</strong>') WHERE product_id = 78 AND locale = 'he';

-- #79 Copper Free Silver Mirror: electrical fittings cover
UPDATE product_translations SET full_description = replace(full_description, 'enjoy 2-year warranty', 'enjoy 3-year warranty') WHERE product_id = 79 AND locale = 'en';
UPDATE product_translations SET full_description = replace(full_description, 'cuentan con 2 años de garantía', 'cuentan con 3 años de garantía') WHERE product_id = 79 AND locale = 'es';
UPDATE product_translations SET full_description = replace(full_description, 'têm 2 anos de garantia', 'têm 3 anos de garantia') WHERE product_id = 79 AND locale = 'pt';
UPDATE product_translations SET full_description = replace(full_description, 'bénéficient de 2 ans de garantie', 'bénéficient de 3 ans de garantie') WHERE product_id = 79 AND locale = 'fr';
UPDATE product_translations SET full_description = replace(full_description, 'genießen 2 Jahre Garantie', 'genießen 3 Jahre Garantie') WHERE product_id = 79 AND locale = 'de';
UPDATE product_translations SET full_description = replace(full_description, 'נהנים מאחריות לשנתיים', 'נהנים מאחריות ל-3 שנים') WHERE product_id = 79 AND locale = 'he';

-- #80 LED mirror: global cover on electronic accessories
UPDATE product_translations SET full_description = replace(full_description, '<strong>2-year global warranty</strong>', '<strong>3-year global warranty</strong>') WHERE product_id = 80 AND locale = 'en';
UPDATE product_translations SET full_description = replace(full_description, '<strong>garantía global de 2 años</strong>', '<strong>garantía global de 3 años</strong>') WHERE product_id = 80 AND locale = 'es';
UPDATE product_translations SET full_description = replace(full_description, '<strong>garantia global de 2 anos</strong>', '<strong>garantia global de 3 anos</strong>') WHERE product_id = 80 AND locale = 'pt';
UPDATE product_translations SET full_description = replace(full_description, '<strong>garantie mondiale de 2 ans</strong>', '<strong>garantie mondiale de 3 ans</strong>') WHERE product_id = 80 AND locale = 'fr';
UPDATE product_translations SET full_description = replace(full_description, '<strong>2 Jahre weltweite Garantie</strong>', '<strong>3 Jahre weltweite Garantie</strong>') WHERE product_id = 80 AND locale = 'de';
UPDATE product_translations SET full_description = replace(full_description, '<strong>אחריות גלובלית של שנתיים</strong>', '<strong>אחריות גלובלית ל-3 שנים</strong>') WHERE product_id = 80 AND locale = 'he';

-- #141 Smart LED Bathroom Mirror with Fully Enclosed Backplate: spec bullet
UPDATE product_translations SET full_description = replace(full_description, 'y garantía de dos años.', 'y garantía de tres años.') WHERE product_id = 141 AND locale = 'es';
UPDATE product_translations SET full_description = replace(full_description, 'e garantia de dois anos.', 'e garantia de três anos.') WHERE product_id = 141 AND locale = 'pt';
UPDATE product_translations SET full_description = replace(full_description, '<strong>Garantie :</strong> deux ans pour cette configuration.', '<strong>Garantie :</strong> trois ans pour cette configuration.') WHERE product_id = 141 AND locale = 'fr';
UPDATE product_translations SET full_description = replace(full_description, '<strong>Garantie:</strong> zwei Jahre', '<strong>Garantie:</strong> drei Jahre') WHERE product_id = 141 AND locale = 'de';
UPDATE product_translations SET full_description = replace(full_description, '<strong>אחריות:</strong> שנתיים', '<strong>אחריות:</strong> 3 שנים') WHERE product_id = 141 AND locale = 'he';

-- Italian copy, added after the first pass: an ILIKE '%garant%' filter does not
-- match "garanzia", so these four rows were missed initially.
UPDATE product_translations SET full_description = replace(full_description, '<strong>2 anni di garanzia</strong>', '<strong>3 anni di garanzia</strong>') WHERE product_id = 78 AND locale = 'it';
UPDATE product_translations SET full_description = replace(full_description, 'godono di 2 anni di garanzia', 'godono di 3 anni di garanzia') WHERE product_id = 79 AND locale = 'it';
UPDATE product_translations SET full_description = replace(full_description, '<strong>garanzia globale di 2 anni</strong>', '<strong>garanzia globale di 3 anni</strong>') WHERE product_id = 80 AND locale = 'it';
UPDATE product_translations SET full_description = replace(full_description, '<strong>Garanzia:</strong> due anni per questa configurazione.', '<strong>Garanzia:</strong> tre anni per questa configurazione.') WHERE product_id = 141 AND locale = 'it';
