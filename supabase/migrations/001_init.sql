-- ============================================================
-- 23rd Founding Anniversary — Disposable Camera
-- Supabase Database Migration v1
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Photo Sessions: one per participant
CREATE TABLE IF NOT EXISTS public.photo_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code  TEXT UNIQUE NOT NULL,
  device_id     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'completed', 'expired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- Photos: up to 7 per session
CREATE TABLE IF NOT EXISTS public.photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.photo_sessions(id) ON DELETE CASCADE,
  photo_number  INTEGER NOT NULL CHECK (photo_number BETWEEN 1 AND 7),
  storage_path  TEXT NOT NULL,
  public_url    TEXT NOT NULL,
  thumbnail_url TEXT,
  filter_name   TEXT DEFAULT 'disposable-90s',
  width         INTEGER,
  height        INTEGER,
  is_public     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, photo_number)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sessions_device_id
  ON public.photo_sessions(device_id);

CREATE INDEX IF NOT EXISTS idx_sessions_session_code
  ON public.photo_sessions(session_code);

CREATE INDEX IF NOT EXISTS idx_sessions_status
  ON public.photo_sessions(status);

CREATE INDEX IF NOT EXISTS idx_sessions_created_at
  ON public.photo_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_photos_session_id
  ON public.photos(session_id);

CREATE INDEX IF NOT EXISTS idx_photos_is_public
  ON public.photos(is_public);

CREATE INDEX IF NOT EXISTS idx_photos_created_at
  ON public.photos(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.photo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Sessions: anyone (anon) can insert, read, and update
CREATE POLICY "anon_insert_sessions"
  ON public.photo_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anon_select_sessions"
  ON public.photo_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_update_sessions"
  ON public.photo_sessions FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_delete_sessions"
  ON public.photo_sessions FOR DELETE
  TO anon, authenticated
  USING (true);

-- Photos: anyone can insert, read (all), update (for moderation), delete
CREATE POLICY "anon_insert_photos"
  ON public.photos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anon_select_photos"
  ON public.photos FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_update_photos"
  ON public.photos FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "anon_delete_photos"
  ON public.photos FOR DELETE
  TO anon, authenticated
  USING (true);

-- ============================================================
-- STORAGE BUCKET SETUP
-- (Run these if you prefer SQL over the Dashboard UI)
-- ============================================================

-- Insert the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  5242880,  -- 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage policies for the bucket
CREATE POLICY "public_read_event_photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'event-photos');

CREATE POLICY "anon_upload_event_photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "anon_update_event_photos"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'event-photos');

CREATE POLICY "anon_delete_event_photos"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'event-photos');

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Session summary view
CREATE OR REPLACE VIEW public.session_summary AS
SELECT
  s.id,
  s.session_code,
  s.device_id,
  s.status,
  s.created_at,
  s.completed_at,
  COUNT(p.id) AS photo_count,
  COUNT(p.id) FILTER (WHERE p.is_public = true) AS public_photo_count
FROM public.photo_sessions s
LEFT JOIN public.photos p ON p.session_id = s.id
GROUP BY s.id, s.session_code, s.device_id, s.status, s.created_at, s.completed_at;

-- ============================================================
-- DONE
-- ============================================================
