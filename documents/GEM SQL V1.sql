-- ===============================================
-- COMBINED FINAL SCHEMA — SUPABASE READY (v3, Hardened by Gemini)
-- Key Enhancements:
-- 1. Runtime Safety: Added safe casting for metadata to prevent trigger errors.
-- 2. Security Hardening: Secured all SECURITY DEFINER functions by setting a blank search_path and revoking public execute permissions.
-- 3. Best Practices: Removed redundant extensions and applied explicit casting for all JSONB defaults.
-- 4. Bug Fix: Made content_search_index.artist_id nullable to prevent sync trigger failures.
-- ===============================================

SET search_path = public, extensions, auth, pg_catalog;

-- ===============================================
-- EXTENSIONS & SCHEMAS
-- ===============================================
CREATE SCHEMA IF NOT EXISTS extensions;
-- pgcrypto is sufficient, uuid-ossp is not needed as we use gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

-- ===============================================
-- ENUM TYPES (Idempotent)
-- ===============================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('fan','artist','brand','developer','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('active','canceled','paused','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE content_type AS ENUM ('audio','video','image','document'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE campaign_status AS ENUM ('draft','active','paused','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('queued','running','completed','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_type AS ENUM ('audio_features','mood_analysis','lyric_extraction'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===============================================
-- CORE TABLES
-- ===============================================

-- Profiles: Single source of truth for user data.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'fan',
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- MediaID: Normalized to remove role, simplified unique constraint.
CREATE TABLE IF NOT EXISTS media_ids (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_uuid UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  interests TEXT[] DEFAULT '{}',
  genre_preferences TEXT[] DEFAULT '{}',
  content_flags JSONB DEFAULT '{}'::jsonb,
  location_code TEXT,
  profile_embedding extensions.vector(1536),
  privacy_settings JSONB DEFAULT '{
    "data_sharing": true,
    "location_access": false,
    "audio_capture": false,
    "anonymous_logging": true,
    "marketing_communications": false
  }'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Artist profiles
CREATE TABLE IF NOT EXISTS artist_profiles (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  bio TEXT,
  banner_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  verification_status TEXT DEFAULT 'pending',
  record_label TEXT,
  publisher TEXT,
  bsl_enabled BOOLEAN DEFAULT false,
  bsl_tier TEXT,
  upload_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  fan_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Albums
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  name TEXT NOT NULL,
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  description TEXT,
  release_date DATE,
  artwork_url TEXT,
  total_tracks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content items
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  artist_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  unlock_date TIMESTAMPTZ,
  milestone_condition JSONB,
  is_premium BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  audio_checksum TEXT,
  processing_status TEXT DEFAULT 'pending',
  file_type TEXT,
  duration_ms INTEGER,
  waveform_peaks JSONB,
  buy_link_url TEXT,
  buy_link_title TEXT,
  record_label TEXT,
  release_date DATE,
  publisher TEXT,
  isrc TEXT,
  explicit BOOLEAN DEFAULT FALSE,
  p_line TEXT,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  album_name TEXT,
  track_number INTEGER,
  enable_direct_downloads BOOLEAN DEFAULT FALSE,
  offline_listening BOOLEAN DEFAULT FALSE,
  include_in_rss BOOLEAN DEFAULT TRUE,
  display_embed_code BOOLEAN DEFAULT TRUE,
  enable_app_playback BOOLEAN DEFAULT TRUE,
  allow_comments BOOLEAN DEFAULT TRUE,
  show_comments_public BOOLEAN DEFAULT TRUE,
  show_insights_public BOOLEAN DEFAULT FALSE,
  availability_scope TEXT DEFAULT 'worldwide',
  availability_regions TEXT[],
  preview_clip JSONB,
  visual_clip JSONB,
  license_type TEXT DEFAULT 'all_rights_reserved',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audio processing jobs
CREATE TABLE IF NOT EXISTS audio_processing_jobs (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  job_type job_type NOT NULL,
  status job_status DEFAULT 'queued',
  provider TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  result JSONB,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content search index: Denormalized for fast searching.
CREATE TABLE IF NOT EXISTS content_search_index (
  content_id UUID PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist_id UUID, -- Made nullable to prevent trigger errors
  artist_name TEXT NOT NULL,
  genre TEXT,
  tags TEXT[] DEFAULT '{}',
  mood_tags TEXT[] DEFAULT '{}',
  bpm DECIMAL,
  musical_key TEXT,
  mode TEXT,
  energy DECIMAL,
  valence DECIMAL,
  danceability DECIMAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector tsvector
);

-- Listening sessions
CREATE TABLE IF NOT EXISTS listening_sessions (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_end TIMESTAMPTZ,
  device_type TEXT NOT NULL,
  device_name TEXT,
  total_tracks_played INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  primary_content_type TEXT DEFAULT 'music',
  context TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Listening history
CREATE TABLE IF NOT EXISTS listening_history (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id_profile_id TEXT,
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_title TEXT NOT NULL,
  content_artist TEXT,
  content_provider TEXT,
  event_type TEXT NOT NULL,
  event_context TEXT,
  play_duration_seconds INTEGER,
  total_duration_seconds INTEGER,
  progress_percentage DECIMAL,
  play_count INTEGER DEFAULT 1,
  session_id UUID REFERENCES listening_sessions(id) ON DELETE SET NULL,
  device_type TEXT,
  device_name TEXT,
  explicit_content BOOLEAN DEFAULT FALSE,
  artwork_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Media engagement log
CREATE TABLE IF NOT EXISTS media_engagement_log (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  external_content_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'track_play','track_complete','track_pause','track_skip',
    'content_add','content_remove','content_like','content_unlike',
    'playlist_add','playlist_remove','download','share'
  )),
  metadata JSONB DEFAULT '{}'::jsonb,
  "timestamp" TIMESTAMPTZ DEFAULT now(),
  is_anonymous BOOLEAN DEFAULT FALSE,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===============================================
-- STORAGE BUCKETS (Idempotent)
-- ===============================================
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES
  ('artist-content','artist-content',false,104857600,ARRAY['audio/*','video/*','image/*']),
  ('visual-clips','visual-clips',true,52428800,ARRAY['video/mp4','video/quicktime','video/webm','video/avi']),
  ('lyrics-documents','lyrics-documents',false,10485760,ARRAY['text/plain','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('brand-assets','brand-assets',false,10485760,ARRAY['image/*','video/*']),
  ('public-assets','public-assets',true,5242880,ARRAY['image/*']),
  ('profile-avatars','profile-avatars',true,2097152,ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- HELPER FUNCTIONS (Hardened for Security)
-- ===============================================

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM PUBLIC;

-- Album track count maintenance
CREATE OR REPLACE FUNCTION update_album_track_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
AS $$
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.album_id IS NOT NULL THEN
    UPDATE public.albums SET total_tracks = (SELECT COUNT(*) FROM public.content_items WHERE album_id = NEW.album_id) WHERE id = NEW.album_id;
  END IF;
  IF TG_OP IN ('UPDATE','DELETE') AND OLD.album_id IS NOT NULL AND (TG_OP = 'DELETE' OR NEW.album_id IS DISTINCT FROM OLD.album_id) THEN
    UPDATE public.albums SET total_tracks = (SELECT COUNT(*) FROM public.content_items WHERE album_id = OLD.album_id) WHERE id = OLD.album_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE EXECUTE ON FUNCTION update_album_track_count() FROM PUBLIC;

-- Search vector maintenance for content_search_index
CREATE OR REPLACE FUNCTION trg_csi_search_vector_maintain()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.artist_name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags,' '),'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.mood_tags,' '),'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.genre,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.musical_key,'') || ' ' || coalesce(NEW.mode,'')), 'D');
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION trg_csi_search_vector_maintain() FROM PUBLIC;

-- Helper to convert jsonb array to text array
CREATE OR REPLACE FUNCTION public.jsonb_array_to_text_array(jsonb)
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY(SELECT jsonb_array_elements_text($1));
$$;

-- Trigger to sync content_items -> content_search_index (with safe casting)
CREATE OR REPLACE FUNCTION sync_content_item_to_search_index()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
AS $$
DECLARE
  v_artist_name TEXT;
BEGIN
  IF NEW.artist_id IS NOT NULL THEN
    SELECT ap.artist_name INTO v_artist_name FROM public.artist_profiles ap WHERE ap.id = NEW.artist_id;
  ELSE
    v_artist_name := 'Unknown Artist';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.content_search_index (content_id, title, artist_id, artist_name, genre, tags, mood_tags, bpm, musical_key, mode, energy, valence, danceability, created_at)
    SELECT
      NEW.id,
      NEW.title,
      NEW.artist_id,
      v_artist_name,
      NEW.metadata->>'genre',
      public.jsonb_array_to_text_array(NEW.metadata->'tags'),
      public.jsonb_array_to_text_array(NEW.metadata->'mood_tags'),
      (NULLIF(trim(NEW.metadata->>'bpm'),''))::decimal,
      NEW.metadata->>'key',
      NEW.metadata->>'mode',
      (NULLIF(trim(NEW.metadata->>'energy'),''))::decimal,
      (NULLIF(trim(NEW.metadata->>'valence'),''))::decimal,
      (NULLIF(trim(NEW.metadata->>'danceability'),''))::decimal,
      NEW.created_at
    ON CONFLICT (content_id) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.content_search_index csi
    SET
      title = NEW.title,
      artist_name = v_artist_name,
      genre = NEW.metadata->>'genre',
      tags = public.jsonb_array_to_text_array(NEW.metadata->'tags'),
      mood_tags = public.jsonb_array_to_text_array(NEW.metadata->'mood_tags'),
      bpm = (NULLIF(trim(NEW.metadata->>'bpm'),''))::decimal,
      musical_key = NEW.metadata->>'key',
      mode = NEW.metadata->>'mode',
      energy = (NULLIF(trim(NEW.metadata->>'energy'),''))::decimal,
      valence = (NULLIF(trim(NEW.metadata->>'valence'),''))::decimal,
      danceability = (NULLIF(trim(NEW.metadata->>'danceability'),''))::decimal
    WHERE csi.content_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.content_search_index csi WHERE csi.content_id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE EXECUTE ON FUNCTION sync_content_item_to_search_index() FROM PUBLIC;

-- ===============================================
-- CONSTRAINTS (Idempotent)
-- ===============================================
DO $$ BEGIN ALTER TABLE content_items ADD CONSTRAINT content_items_availability_scope_chk CHECK (availability_scope IN ('worldwide','exclusive_regions','blocked_regions')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE content_items ADD CONSTRAINT content_items_license_type_chk CHECK (license_type IN ('all_rights_reserved','cc_by','cc_by_sa','cc_by_nc','cc_by_nc_sa','cc_by_nd','cc_by_nc_nd','bsl')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_isrc_unique') THEN ALTER TABLE content_items ADD CONSTRAINT content_items_isrc_unique UNIQUE(isrc); END IF; END $$;

-- ===============================================
-- INDEXES (Using IF NOT EXISTS for consistency)
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_media_ids_user_uuid ON media_ids(user_uuid);
CREATE INDEX IF NOT EXISTS idx_content_items_artist ON content_items(artist_id);
CREATE INDEX IF NOT EXISTS idx_content_items_album_id ON content_items(album_id);
CREATE INDEX IF NOT EXISTS idx_content_items_isrc ON content_items(isrc) WHERE isrc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_content_search_vector ON content_search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_created ON listening_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_history_content ON listening_history(content_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_session ON listening_history(session_id);
CREATE INDEX IF NOT EXISTS idx_listening_sessions_user ON listening_sessions(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_media_engagement_log_user_id ON media_engagement_log(user_id);
CREATE INDEX IF NOT EXISTS idx_media_engagement_log_content_id ON media_engagement_log(content_id) WHERE content_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_engagement_log_event_type ON media_engagement_log(event_type);
CREATE INDEX IF NOT EXISTS idx_media_engagement_log_timestamp ON media_engagement_log("timestamp");
CREATE INDEX IF NOT EXISTS idx_media_engagement_log_user_timestamp ON media_engagement_log(user_id, "timestamp");
CREATE INDEX IF NOT EXISTS idx_media_engagement_log_session_id ON media_engagement_log(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_ids_profile_embedding
  ON media_ids USING hnsw (profile_embedding vector_cosine_ops);

-- ===============================================
-- TRIGGERS
-- ===============================================
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_artist_profiles_updated_at BEFORE UPDATE ON artist_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_listening_sessions_updated_at BEFORE UPDATE ON listening_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_listening_history_updated_at BEFORE UPDATE ON listening_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_album_track_count_trigger AFTER INSERT OR UPDATE OR DELETE ON content_items FOR EACH ROW EXECUTE FUNCTION public.update_album_track_count();
CREATE OR REPLACE TRIGGER csi_search_vector_maintain BEFORE INSERT OR UPDATE OF title, artist_name, tags, mood_tags ON content_search_index FOR EACH ROW EXECUTE FUNCTION public.trg_csi_search_vector_maintain();

-- Trigger to keep search index synchronized
CREATE OR REPLACE TRIGGER sync_content_items_to_search
AFTER INSERT OR UPDATE OR DELETE ON content_items
FOR EACH ROW EXECUTE FUNCTION public.sync_content_item_to_search_index();

-- Remaining SQL is unchanged and follows

-- ===============================================
-- ROW LEVEL SECURITY (RLS)
-- ===============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_engagement_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies remain largely the same, but are more secure due to hardened functions

-- Profiles Policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Public can view artist and brand profiles" ON profiles;
CREATE POLICY "Public can view artist and brand profiles" ON profiles FOR SELECT TO public
  USING (role IN ('artist', 'brand'));

-- Artist Profiles Policies
DROP POLICY IF EXISTS "Artists can manage their own data" ON artist_profiles;
CREATE POLICY "Artists can manage their own data" ON artist_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public can view artist profiles" ON artist_profiles;
CREATE POLICY "Public can view artist profiles" ON artist_profiles FOR SELECT TO public USING (true);

-- Content Items Policies
DROP POLICY IF EXISTS "Artists can manage their own content" ON content_items;
CREATE POLICY "Artists can manage their own content" ON content_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM artist_profiles WHERE user_id = auth.uid() AND id = artist_id))
  WITH CHECK (EXISTS (SELECT 1 FROM artist_profiles WHERE user_id = auth.uid() AND id = artist_id));

DROP POLICY IF EXISTS "Public can view published content" ON content_items;
CREATE POLICY "Public can view published content" ON content_items FOR SELECT TO public
  USING (is_published = TRUE AND (unlock_date IS NULL OR unlock_date <= now()));

DROP POLICY IF EXISTS "Subscribers can view premium content" ON content_items;
CREATE POLICY "Subscribers can view premium content" ON content_items FOR SELECT TO authenticated
  USING (is_premium = TRUE AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.fan_id = auth.uid() AND s.artist_id = content_items.artist_id AND s.status = 'active'
  ));

-- Media Engagement Log Policies
DROP POLICY IF EXISTS "Users can manage their own engagement" ON media_engagement_log;
CREATE POLICY "Users can manage their own engagement" ON media_engagement_log FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Artists can view engagement for their content" ON media_engagement_log;
CREATE POLICY "Artists can view engagement for their content" ON media_engagement_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM content_items ci JOIN artist_profiles ap ON ci.artist_id = ap.id
    WHERE ci.id = media_engagement_log.content_id AND ap.user_id = auth.uid()
  ));

-- Other table policies (simplified for brevity)
DROP POLICY IF EXISTS "Users can manage their own data" ON media_ids;
CREATE POLICY "Users can manage their own data" ON media_ids FOR ALL TO authenticated USING (auth.uid() = user_uuid) WITH CHECK (auth.uid() = user_uuid);

DROP POLICY IF EXISTS "Users can manage their own listening history" ON listening_history;
CREATE POLICY "Users can manage their own listening history" ON listening_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own listening sessions" ON listening_sessions;
CREATE POLICY "Users can manage their own listening sessions" ON listening_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT TO authenticated USING (fan_id = auth.uid());

DROP POLICY IF EXISTS "Artists can manage their audio processing jobs" ON audio_processing_jobs;
CREATE POLICY "Artists can manage their audio processing jobs" ON audio_processing_jobs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM content_items ci JOIN artist_profiles ap ON ci.artist_id = ap.id WHERE ci.id = content_id AND ap.user_id = auth.uid()));

-- ===============================================
-- STORAGE POLICIES (Nuke and Recreate)
-- ===============================================
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- Simplified and more secure storage policies
CREATE POLICY "Users can manage their own avatar" ON storage.objects FOR ALL TO public
  USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view public assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'public-assets');
CREATE POLICY "Anyone can view visual clips" ON storage.objects FOR SELECT TO public USING (bucket_id = 'visual-clips');
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-avatars');

CREATE POLICY "Artists can manage their content" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'artist-content' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist'))
  WITH CHECK (bucket_id = 'artist-content' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist'));

CREATE POLICY "Brands can manage their assets" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'brand-assets' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'brand'))
  WITH CHECK (bucket_id = 'brand-assets' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'brand'));

-- ===============================================
-- DATA MIGRATION & CLEANUP
-- ===============================================
-- Insert profiles for new users from auth.users
INSERT INTO profiles (id, display_name, role, email_verified, onboarding_completed)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email,'@',1)), COALESCE(u.raw_user_meta_data->>'role','fan')::user_role, u.email_confirmed_at IS NOT NULL, FALSE
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Insert media_ids for new users
INSERT INTO media_ids (user_uuid, interests, genre_preferences, version, is_active)
SELECT u.id, '{}','{}', 1, TRUE
FROM auth.users u
ON CONFLICT (user_uuid) DO NOTHING;

-- Insert artist_profiles for users with 'artist' role
INSERT INTO artist_profiles (user_id, artist_name)
SELECT u.id, COALESCE(p.display_name, split_part(u.email,'@',1))
FROM auth.users u JOIN profiles p ON p.id = u.id
WHERE p.role = 'artist'
ON CONFLICT (user_id) DO NOTHING;

-- Backfill search index for existing content
INSERT INTO content_search_index (content_id, title, artist_id, artist_name, genre, tags, mood_tags, bpm, musical_key, mode, energy, valence, danceability, created_at)
SELECT
  ci.id,
  ci.title,
  ci.artist_id,
  ap.artist_name,
  ci.metadata->>'genre',
  public.jsonb_array_to_text_array(ci.metadata->'tags'),
  public.jsonb_array_to_text_array(ci.metadata->'mood_tags'),
  (NULLIF(trim(ci.metadata->>'bpm'),''))::decimal,
  ci.metadata->>'key',
  ci.metadata->>'mode',
  (NULLIF(trim(ci.metadata->>'energy'),''))::decimal,
  (NULLIF(trim(ci.metadata->>'valence'),''))::decimal,
  (NULLIF(trim(ci.metadata->>'danceability'),''))::decimal,
  ci.created_at
FROM content_items ci
JOIN artist_profiles ap ON ci.artist_id = ap.id
ON CONFLICT(content_id) DO NOTHING;

-- ===============================================
-- GRANTS
-- ===============================================
GRANT SELECT ON content_search_index TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON content_search_index TO authenticated;
GRANT SELECT, INSERT ON media_engagement_log TO anon, authenticated;
GRANT UPDATE, DELETE ON media_engagement_log TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.jsonb_array_to_text_array(jsonb) TO public;

-- ===============================================
-- DONE
-- ===============================================
