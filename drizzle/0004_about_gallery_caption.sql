-- Add nullable caption column to about_gallery for the new
-- 'exhibition' imageType (existing 'factory'/'certification' rows ignore it).
-- ADD COLUMN with no default is a metadata-only change in Postgres — instant,
-- no table rewrite, no extended lock. IF NOT EXISTS makes it idempotent.

ALTER TABLE about_gallery ADD COLUMN IF NOT EXISTS caption text;
