-- Video library: one localized JSONB-backed table plus a public storage bucket.
-- CMS writes go through the Next.js API using the app database connection; the
-- public Data API can only read published rows.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  source_type text NOT NULL DEFAULT 'embed' CHECK (source_type IN ('embed', 'upload', 'direct')),
  video_url text,
  embed_url text,
  thumbnail_url text,
  category text,
  tags text[],
  duration_seconds integer,
  title jsonb NOT NULL DEFAULT '{}'::jsonb,
  excerpt jsonb DEFAULT '{}'::jsonb,
  body jsonb DEFAULT '{}'::jsonb,
  seo_title jsonb DEFAULT '{}'::jsonb,
  seo_description jsonb DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS videos_status_idx ON public.videos (status);
CREATE INDEX IF NOT EXISTS videos_published_at_idx ON public.videos (published_at DESC);
CREATE INDEX IF NOT EXISTS videos_slug_idx ON public.videos (slug);
CREATE INDEX IF NOT EXISTS videos_category_idx ON public.videos (category);
CREATE INDEX IF NOT EXISTS videos_tags_gin_idx ON public.videos USING gin (tags);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.videos TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.videos FROM anon, authenticated;

DROP POLICY IF EXISTS "videos public read published" ON public.videos;
CREATE POLICY "videos public read published"
  ON public.videos
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE OR REPLACE FUNCTION public.set_videos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS videos_set_updated_at ON public.videos;
CREATE TRIGGER videos_set_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.set_videos_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  524288000,
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
