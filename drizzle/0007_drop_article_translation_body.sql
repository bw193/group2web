-- Stage 2 of the article body split (follows 0006). The heavy body HTML now
-- lives exclusively in article_translation_bodies; article_translations is a
-- light, product_translations-style routing/SEO table. This drops the
-- deprecated column.
--
-- ⚠ ORDERING: apply this ONLY AFTER the code that stopped reading/writing
-- article_translations.body is deployed to production. The live (pre-deploy)
-- code still SELECTs body in the CMS GET and dual-writes it; dropping the
-- column before that deploy would break those paths. Sequence: deploy code →
-- verify prod → apply this migration.
--
-- Safety: the data is already duplicated in article_translation_bodies (the
-- 0006 backfill + dual-writes, verified zero-drift), so no content is lost.
-- Idempotent / safe to re-run.

ALTER TABLE article_translations DROP COLUMN IF EXISTS body;
