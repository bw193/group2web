-- "technology" and "news" were created with an English name only, so every
-- other locale fell back to it: /de/insight showed a TECHNOLOGY tab, and the
-- category landing pages would carry English names in their breadcrumbs,
-- kickers and CollectionPage markup. These fill the six missing locales in the
-- register of the existing names (Handwerk, Beschaffung, Fertigung, ...).
--
-- ON CONFLICT DO NOTHING: a name an editor has since typed in the CMS wins,
-- and re-running this file changes nothing.

insert into article_category_translations (category_id, locale, name)
select c.id, v.locale, v.name
  from article_categories c
  join (values
    ('technology', 'es', 'Tecnología'),
    ('technology', 'pt', 'Tecnologia'),
    ('technology', 'fr', 'Technologie'),
    ('technology', 'it', 'Tecnologia'),
    ('technology', 'de', 'Technik'),
    ('technology', 'he', 'טכנולוגיה'),
    ('news',       'es', 'Noticias'),
    ('news',       'pt', 'Notícias'),
    ('news',       'fr', 'Actualités'),
    ('news',       'it', 'Notizie'),
    ('news',       'de', 'Aktuelles'),
    ('news',       'he', 'חדשות')
  ) as v(key, locale, name) on v.key = c.key
on conflict (category_id, locale) do nothing;
