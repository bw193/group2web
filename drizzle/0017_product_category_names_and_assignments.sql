-- Two CMS problems surfaced while building the product category pages.
--
-- 1. Categories 1 and 2 had their names swapped in five languages. Category 1
--    holds the LED mirrors (79 of its 90 product names say LED, backlit or
--    lighted) and category 2 the non-LED bathroom mirrors, as English and
--    Hebrew say; German, Spanish, French, Italian and Portuguese had them the
--    other way round, so /de/products labelled 90 LED mirrors
--    "Badezimmerspiegel".
--
-- 2. Two active products had no category, so they would have had no place in
--    /products/<category>/<product>: #191 "Premium Walnut-Toned Curved Smart
--    LED Mirror" (an LED mirror) and #23 "Arched Top Wall Mirror" (a non-LED
--    wall mirror, like the rest of category 2).
--
-- Every statement is anchored on the wrong value, so re-running changes nothing.

update category_translations set name = 'LED-Spiegel'            where category_id = 1 and locale = 'de' and name = 'Badezimmerspiegel';
update category_translations set name = 'Espejos LED'            where category_id = 1 and locale = 'es' and name = 'Espejos de Baño';
update category_translations set name = 'Miroirs LED'            where category_id = 1 and locale = 'fr' and name = 'Miroirs de Salle de Bain';
update category_translations set name = 'Specchi LED'            where category_id = 1 and locale = 'it' and name = 'Specchi da Bagno';
update category_translations set name = 'Espelhos LED'           where category_id = 1 and locale = 'pt' and name = 'Espelhos de Banheiro';

update category_translations set name = 'Badezimmerspiegel'       where category_id = 2 and locale = 'de' and name = 'LED-Spiegel';
update category_translations set name = 'Espejos de Baño'         where category_id = 2 and locale = 'es' and name = 'Espejos LED';
update category_translations set name = 'Miroirs de Salle de Bain' where category_id = 2 and locale = 'fr' and name = 'Miroirs LED';
update category_translations set name = 'Specchi da Bagno'        where category_id = 2 and locale = 'it' and name = 'Specchi LED';
update category_translations set name = 'Espelhos de Banheiro'    where category_id = 2 and locale = 'pt' and name = 'Espelhos LED';

update products set category_id = 1, updated_at = now() where id = 191 and category_id is null;
update products set category_id = 2, updated_at = now() where id = 23  and category_id is null;
