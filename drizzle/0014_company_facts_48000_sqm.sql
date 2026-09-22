-- The factory is 48,000 m² and the company has run since 2005 (21+ years).
-- The CMS carried four different areas — 42,800 (six About rows), 50,000 (the
-- Hebrew About stat and six video excerpts), 46,800 (the English video excerpt)
-- and 35,000 (the Hebrew About prose) — plus a fifteen-year claim in the FAQ.
-- Every statement is anchored on the wrong value, so re-running changes nothing.

-- About page stat, all seven locales
update about_page set factory_size = '48000㎡'
 where factory_size in ('42800㎡', '46800㎡', '50000㎡', '35000㎡');

-- About page prose, in each language's own number format
update about_page set content = replace(content, '42,800 square meters', '48,000 square meters') where locale = 'en';
update about_page set content = replace(content, '42.800 metros cuadrados', '48.000 metros cuadrados') where locale = 'es';
update about_page set content = replace(content, '42.800 metros quadrados', '48.000 metros quadrados') where locale = 'pt';
update about_page set content = replace(content, '42 800 mètres carrés', '48 000 mètres carrés') where locale = 'fr';
update about_page set content = replace(content, '42.800 metri quadrati', '48.000 metri quadrati') where locale = 'it';
update about_page set content = replace(content, '42.800 Quadratmeter', '48.000 Quadratmeter') where locale = 'de';
update about_page set content = replace(content, '35,000 מ״ר', '48,000 מ״ר') where locale = 'he';

-- Factory tour video excerpt: one localized string per key inside the jsonb
update videos
   set excerpt = replace(replace(replace(replace(excerpt::text,
         '46,800 m²', '48,000 m²'),
         '50.000 m²', '48.000 m²'),
         '50 000 m²', '48 000 m²'),
         '50,000 מ״ר', '48,000 מ״ר')::jsonb
 where slug = 'professional-led-mirror-manufacturer-in-china-chengtai-mirror-factory-tour';

-- The factory FAQ claimed fifteen years in every language
update faq_translations set answer = 'Yes, we have specialized in the mirror manufacturing field since 2005, and we manufacture LED mirrors, bathroom mirrors, dressing mirrors and more.'
 where locale = 'en' and answer like '%fifteen years%';
update faq_translations set answer = 'Sí, nos especializamos en la fabricación de espejos desde 2005. Fabricamos espejos LED, espejos de baño, espejos de vestidor y otros modelos.'
 where locale = 'es' and answer like '%quince años%';
update faq_translations set answer = 'Sim, somos especializados na fabricação de espelhos desde 2005. Fabricamos espelhos LED, espelhos para banheiro, espelhos de vestir e outros modelos.'
 where locale = 'pt' and answer like '%quinze anos%';
update faq_translations set answer = 'Oui, nous sommes spécialisés dans la fabrication de miroirs depuis 2005. Nous fabriquons des miroirs LED, des miroirs de salle de bains, des miroirs d’habillage et d’autres modèles.'
 where locale = 'fr' and answer like '%quinze ans%';
update faq_translations set answer = 'Sì, siamo specializzati nella produzione di specchi dal 2005. Produciamo specchi LED, specchi da bagno, specchi da camerino e altri modelli.'
 where locale = 'it' and answer like '%quindici anni%';
update faq_translations set answer = 'Ja, wir sind seit 2005 auf die Herstellung von Spiegeln spezialisiert. Wir produzieren LED-Spiegel, Badezimmerspiegel, Ankleidespiegel und weitere Modelle.'
 where locale = 'de' and answer like '%fünfzehn Jahren%';
update faq_translations set answer = 'כן, אנו מתמחים בתחום ייצור המראות משנת 2005, ומייצרים מראות LED, מראות אמבטיה, מראות איפור ועוד.'
 where locale = 'he' and answer like '%חמש עשרה שנים%';

-- page_seo is no longer read by the site, but it also carried a stale area
update page_seo set meta_description = replace(meta_description, '35,000㎡', '48,000㎡')
 where meta_description like '%35,000㎡%';
