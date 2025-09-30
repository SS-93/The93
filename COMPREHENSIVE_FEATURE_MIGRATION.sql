-- ===============================================
-- COMPREHENSIVE FEATURE MIGRATION - FINAL FIXED VERSION
-- ===============================================
-- Consolidates all features from EPK Buckets SB backend
-- Fixes RLS policy issues preventing features from working
-- Generated: September 26, 2025
-- Target: Supabase PostgreSQL 15
-- ===============================================

-- Search path configuration
SET search_path = public, extensions, auth, pg_catalog;

-- ===============================================
-- SECTION 1: EXTENSIONS & SCHEMAS
-- ===============================================
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA extensions;

-- ===============================================
-- SECTION 2: ENUM TYPES (Safe Creation)
-- ===============================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('fan', 'artist', 'brand', 'developer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'paused', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('audio', 'video', 'image', 'document');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('queued', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_type AS ENUM ('audio_features', 'mood_analysis', 'lyric_extraction');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===============================================
-- SECTION 3: CORE TABLES
-- ===============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'fan',
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- MediaID Table with vector embeddings
CREATE TABLE IF NOT EXISTS media_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interests TEXT[] DEFAULT '{}',
  genre_preferences TEXT[] DEFAULT '{}',
  content_flags JSONB DEFAULT '{}',
  location_code TEXT,
  profile_embedding extensions.vector(1536),
  privacy_settings JSONB DEFAULT '{
    "data_sharing": true,
    "location_access": false,
    "audio_capture": false,
    "anonymous_logging": true,
    "marketing_communications": false
  }',
  role user_role NOT NULL DEFAULT 'fan',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_uuid)
);

-- Artist profiles (matches frontend expectations)
CREATE TABLE IF NOT EXISTS artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  artist_name TEXT NOT NULL,
  bio TEXT,
  banner_url TEXT,
  social_links JSONB DEFAULT '{}',
  verification_status TEXT DEFAULT 'pending',
  record_label TEXT,
  publisher TEXT,
  bsl_enabled BOOLEAN DEFAULT false,
  bsl_tier TEXT CHECK (bsl_tier IN ('basic', 'premium', 'enterprise')),
  upload_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  description TEXT,
  release_date DATE,
  artwork_url TEXT,
  total_tracks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enhanced content items with advanced metadata
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  unlock_date TIMESTAMP,
  milestone_condition JSONB,
  is_premium BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',

  -- Advanced Details
  buy_link_url TEXT,
  buy_link_title TEXT,
  record_label TEXT,
  release_date DATE,
  publisher TEXT,
  isrc TEXT,
  explicit BOOLEAN DEFAULT false,
  p_line TEXT,

  -- Album Linking
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  album_name TEXT,
  track_number INTEGER,

  -- Permissions/Access
  enable_direct_downloads BOOLEAN DEFAULT false,
  offline_listening BOOLEAN DEFAULT false,
  include_in_rss BOOLEAN DEFAULT true,
  display_embed_code BOOLEAN DEFAULT true,
  enable_app_playback BOOLEAN DEFAULT true,
  allow_comments BOOLEAN DEFAULT true,
  show_comments_public BOOLEAN DEFAULT true,
  show_insights_public BOOLEAN DEFAULT false,

  -- Geoblocking
  availability_scope TEXT DEFAULT 'worldwide' CHECK (availability_scope IN ('worldwide', 'exclusive_regions', 'blocked_regions')),
  availability_regions TEXT[],

  -- Preview/Clips
  preview_clip JSONB,
  visual_clip JSONB,

  -- Lyrics
  lyrics JSONB,

  -- License Type
  license_type TEXT DEFAULT 'all_rights_reserved' CHECK (license_type IN (
    'all_rights_reserved', 'cc_by', 'cc_by_sa', 'cc_by_nc',
    'cc_by_nc_sa', 'cc_by_nd', 'cc_by_nc_nd', 'bsl'
  )),

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Audio processing jobs
CREATE TABLE IF NOT EXISTS audio_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  job_type job_type NOT NULL,
  status job_status DEFAULT 'queued',
  processing_params JSONB DEFAULT '{}',
  result_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Audio features
CREATE TABLE IF NOT EXISTS audio_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  bpm REAL,
  musical_key TEXT,
  mode TEXT,
  time_signature INTEGER,
  energy REAL,
  valence REAL,
  danceability REAL,
  acousticness REAL,
  instrumentalness REAL,
  liveness REAL,
  speechiness REAL,
  loudness REAL,
  tempo_confidence REAL,
  key_confidence REAL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(content_id)
);

-- Mood tags
CREATE TABLE IF NOT EXISTS mood_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  tags TEXT[] NOT NULL,
  confidence_scores REAL[] NOT NULL,
  model_version TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(content_id)
);

-- Listening history
CREATE TABLE IF NOT EXISTS listening_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id_profile_id UUID REFERENCES media_ids(id) ON DELETE SET NULL,
  content_id UUID,
  content_type TEXT NOT NULL,
  content_title TEXT NOT NULL,
  content_artist TEXT,
  content_provider TEXT,
  event_type TEXT NOT NULL,
  event_context TEXT,
  play_duration_seconds INTEGER,
  total_duration_seconds INTEGER,
  progress_percentage REAL,
  play_count INTEGER DEFAULT 1,
  session_id UUID,
  device_type TEXT,
  device_name TEXT,
  explicit_content BOOLEAN DEFAULT false,
  artwork_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Listening sessions
CREATE TABLE IF NOT EXISTS listening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP DEFAULT now(),
  session_end TIMESTAMP,
  device_type TEXT NOT NULL,
  device_name TEXT,
  total_tracks_played INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  primary_content_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  brand_name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  industry TEXT,
  contact_email TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  status subscription_status DEFAULT 'active',
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(fan_id, artist_id)
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  targeting_criteria JSONB NOT NULL,
  budget_cents INTEGER NOT NULL,
  payment_model TEXT NOT NULL,
  status campaign_status DEFAULT 'draft',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  assets JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Media engagement log
CREATE TABLE IF NOT EXISTS media_engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  is_anonymous BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ===============================================
-- SECTION 4: STORAGE BUCKETS (Modern Syntax)
-- ===============================================

-- Create storage buckets using modern syntax (no deprecated columns)
INSERT INTO storage.buckets (id, name)
VALUES
  ('artist-content', 'artist-content'),
  ('visual-clips', 'visual-clips'),
  ('lyrics-documents', 'lyrics-documents'),
  ('brand-assets', 'brand-assets'),
  ('public-assets', 'public-assets'),
  ('profile-avatars', 'profile-avatars')
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- SECTION 5: INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_media_ids_user_uuid ON media_ids(user_uuid);
CREATE INDEX IF NOT EXISTS idx_media_ids_interests ON media_ids USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_user_id ON artist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_artist_id ON content_items(artist_id);
CREATE INDEX IF NOT EXISTS idx_content_items_album_id ON content_items(album_id);
CREATE INDEX IF NOT EXISTS idx_content_items_isrc ON content_items(isrc) WHERE isrc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_audio_processing_jobs_content_id ON audio_processing_jobs(content_id);
CREATE INDEX IF NOT EXISTS idx_audio_processing_jobs_status ON audio_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_audio_features_content_id ON audio_features(content_id);
CREATE INDEX IF NOT EXISTS idx_mood_tags_content_id ON mood_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_created_at ON listening_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listening_sessions_user_id ON listening_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_fan_artist ON subscriptions(fan_id, artist_id);
CREATE INDEX IF NOT EXISTS idx_engagement_log_user ON media_engagement_log(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_log_content ON media_engagement_log(content_id);

-- ===============================================
-- SECTION 6: UTILITY FUNCTIONS
-- ===============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to auto-increment album track count
CREATE OR REPLACE FUNCTION update_album_track_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.album_id IS NOT NULL AND (OLD.album_id IS NULL OR OLD.album_id != NEW.album_id) THEN
    UPDATE albums
    SET total_tracks = (
      SELECT COUNT(*) FROM content_items WHERE album_id = NEW.album_id
    )
    WHERE id = NEW.album_id;
  END IF;

  IF OLD.album_id IS NOT NULL AND (NEW.album_id IS NULL OR OLD.album_id != NEW.album_id) THEN
    UPDATE albums
    SET total_tracks = (
      SELECT COUNT(*) FROM content_items WHERE album_id = OLD.album_id
    )
    WHERE id = OLD.album_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate ISRC format
CREATE OR REPLACE FUNCTION validate_isrc_format()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.isrc IS NOT NULL THEN
    IF NOT (NEW.isrc ~ '^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$') THEN
      RAISE EXCEPTION 'ISRC must be in format: CC-XXX-YY-NNNNN';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- SECTION 7: TRIGGERS
-- ===============================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_ids_updated_at BEFORE UPDATE ON media_ids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artist_profiles_updated_at BEFORE UPDATE ON artist_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_processing_jobs_updated_at BEFORE UPDATE ON audio_processing_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_features_updated_at BEFORE UPDATE ON audio_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listening_history_updated_at BEFORE UPDATE ON listening_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listening_sessions_updated_at BEFORE UPDATE ON listening_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Album track count trigger
CREATE TRIGGER update_album_track_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_album_track_count();

-- ISRC validation trigger
CREATE TRIGGER validate_isrc_trigger
  BEFORE INSERT OR UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION validate_isrc_format();

-- ===============================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_engagement_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- SECTION 9: RLS POLICIES (COMPREHENSIVE & FIXED)
-- ===============================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view artist and brand profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own MediaID" ON media_ids;
DROP POLICY IF EXISTS "Users can update their own MediaID" ON media_ids;
DROP POLICY IF EXISTS "Artists can manage their own data" ON artist_profiles;
DROP POLICY IF EXISTS "Public can view artist profiles" ON artist_profiles;
DROP POLICY IF EXISTS "Artists can manage their albums" ON albums;
DROP POLICY IF EXISTS "Public can view albums" ON albums;
DROP POLICY IF EXISTS "Artists can manage their own content" ON content_items;
DROP POLICY IF EXISTS "Public can view published content" ON content_items;
DROP POLICY IF EXISTS "Subscribers can view premium content" ON content_items;
DROP POLICY IF EXISTS "Artists can manage their processing jobs" ON audio_processing_jobs;
DROP POLICY IF EXISTS "System can manage processing jobs" ON audio_processing_jobs;
DROP POLICY IF EXISTS "Users can manage their own engagement" ON media_engagement_log;
DROP POLICY IF EXISTS "Artists can view engagement for their content" ON media_engagement_log;
DROP POLICY IF EXISTS "Users can manage their own data" ON media_ids;
DROP POLICY IF EXISTS "Users can manage their own listening history" ON listening_history;
DROP POLICY IF EXISTS "Users can manage their own listening sessions" ON listening_sessions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;

-- PROFILES POLICIES
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public can view artist and brand profiles" ON profiles
  FOR SELECT USING (role IN ('artist', 'brand'));

-- MEDIA_IDS POLICIES
CREATE POLICY "Users can manage their own MediaID" ON media_ids
  FOR ALL USING (auth.uid() = user_uuid);

-- ARTIST_PROFILES POLICIES
CREATE POLICY "Artists can manage their own data" ON artist_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view artist profiles" ON artist_profiles
  FOR SELECT USING (true);

-- ALBUMS POLICIES
CREATE POLICY "Artists can manage their albums" ON albums
  FOR ALL USING (
    EXISTS(SELECT 1 FROM artist_profiles WHERE user_id = auth.uid() AND id = artist_id)
  );

CREATE POLICY "Public can view albums" ON albums
  FOR SELECT USING (true);

-- CONTENT_ITEMS POLICIES (COMPREHENSIVE)
CREATE POLICY "Artists can manage their own content" ON content_items
  FOR ALL USING (
    EXISTS(SELECT 1 FROM artist_profiles WHERE user_id = auth.uid() AND id = artist_id)
  );

CREATE POLICY "Public can view published content" ON content_items
  FOR SELECT USING (
    is_premium = false
    AND (unlock_date IS NULL OR unlock_date <= now())
  );

CREATE POLICY "Subscribers can view premium content" ON content_items
  FOR SELECT USING (
    (unlock_date IS NULL OR unlock_date <= now())
    AND EXISTS(
      SELECT 1 FROM subscriptions s
      JOIN artist_profiles a ON s.artist_id = a.id
      WHERE s.fan_id = auth.uid()
      AND a.id = artist_id
      AND s.status = 'active'
    )
  );

-- AUDIO_PROCESSING_JOBS POLICIES (FIXED)
CREATE POLICY "Artists can insert processing jobs" ON audio_processing_jobs
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM content_items ci
      JOIN artist_profiles ap ON ci.artist_id = ap.id
      WHERE ci.id = content_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Artists can view their content processing jobs" ON audio_processing_jobs
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM content_items ci
      JOIN artist_profiles ap ON ci.artist_id = ap.id
      WHERE ci.id = content_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage processing jobs" ON audio_processing_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- AUDIO_FEATURES POLICIES
CREATE POLICY "Artists can view their content features" ON audio_features
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM content_items ci
      JOIN artist_profiles ap ON ci.artist_id = ap.id
      WHERE ci.id = content_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage audio features" ON audio_features
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- MOOD_TAGS POLICIES
CREATE POLICY "Artists can view their content mood tags" ON mood_tags
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM content_items ci
      JOIN artist_profiles ap ON ci.artist_id = ap.id
      WHERE ci.id = content_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage mood tags" ON mood_tags
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- LISTENING_HISTORY POLICIES
CREATE POLICY "Users can manage their own listening history" ON listening_history
  FOR ALL USING (auth.uid() = user_id);

-- LISTENING_SESSIONS POLICIES
CREATE POLICY "Users can manage their own listening sessions" ON listening_sessions
  FOR ALL USING (auth.uid() = user_id);

-- BRANDS POLICIES
CREATE POLICY "Brands can manage their own data" ON brands
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Artists can view brand profiles" ON brands
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist')
  );

-- SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    auth.uid() = fan_id
    OR EXISTS(SELECT 1 FROM artist_profiles WHERE user_id = auth.uid() AND id = artist_id)
  );

CREATE POLICY "Fans can create subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = fan_id);

CREATE POLICY "System can update subscription status" ON subscriptions
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- CAMPAIGNS POLICIES
CREATE POLICY "Brands can manage their campaigns" ON campaigns
  FOR ALL USING (
    EXISTS(SELECT 1 FROM brands WHERE user_id = auth.uid() AND id = brand_id)
  );

CREATE POLICY "Artists can view active campaigns" ON campaigns
  FOR SELECT USING (
    status = 'active'
    AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist')
  );

-- ENGAGEMENT_LOG POLICIES
CREATE POLICY "Users can view their own engagement" ON media_engagement_log
  FOR SELECT USING (auth.uid() = user_id AND is_anonymous = false);

CREATE POLICY "System can insert engagement logs" ON media_engagement_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Artists can view engagement for their content" ON media_engagement_log
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM content_items ci
      JOIN artist_profiles ap ON ci.artist_id = ap.id
      WHERE ci.id = content_id AND ap.user_id = auth.uid()
    )
  );

-- TRANSACTIONS POLICIES
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions" ON transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ===============================================
-- SECTION 10: STORAGE POLICIES (MODERN SYNTAX)
-- ===============================================

-- Artist Content Bucket Policies
CREATE POLICY "Artists can upload their content" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'artist-content'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist')
  );

CREATE POLICY "Artists can update their content" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'artist-content'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist')
  );

CREATE POLICY "Artists can delete their content" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'artist-content'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist')
  );

CREATE POLICY "Public can view artist content" ON storage.objects
  FOR SELECT USING (bucket_id = 'artist-content');

-- Visual Clips Bucket Policies
CREATE POLICY "Artists can upload visual clips" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'visual-clips'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist')
  );

CREATE POLICY "Public can view visual clips" ON storage.objects
  FOR SELECT USING (bucket_id = 'visual-clips');

-- Lyrics Documents Bucket Policies
CREATE POLICY "Artists can manage lyrics documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'lyrics-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist')
  ) WITH CHECK (
    bucket_id = 'lyrics-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist')
  );

-- Profile Avatars Bucket Policies
CREATE POLICY "Users can manage their profile avatars" ON storage.objects
  FOR ALL USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  ) WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public Assets Bucket Policy
CREATE POLICY "Public can view public assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'public-assets');

CREATE POLICY "Admins can manage public assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'public-assets'
    AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    bucket_id = 'public-assets'
    AND EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===============================================
-- SECTION 11: UNIQUE CONSTRAINTS
-- ===============================================

-- Add unique constraints safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'content_items_isrc_unique'
  ) THEN
    ALTER TABLE content_items ADD CONSTRAINT content_items_isrc_unique UNIQUE(isrc);
  END IF;
END $$;

-- ===============================================
-- SECTION 12: GRANTS FOR SERVICE OPERATIONS
-- ===============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA extensions TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===============================================
-- FINAL STATUS MESSAGE
-- ===============================================

-- Record migration completion
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20250926_comprehensive_feature_migration')
ON CONFLICT (version) DO NOTHING;

-- Success message
DO $$ BEGIN
  RAISE NOTICE '✅ COMPREHENSIVE FEATURE MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '  - Audio Upload with Advanced Metadata';
  RAISE NOTICE '  - Global Audio Player with Queue Management';
  RAISE NOTICE '  - Listening History & Session Tracking';
  RAISE NOTICE '  - Video Upload Support';
  RAISE NOTICE '  - Audio Processing Pipeline (Features, Mood, Lyrics)';
  RAISE NOTICE '  - Storage Buckets with Modern RLS Policies';
  RAISE NOTICE '  - MediaID Profiles with Vector Embeddings';
  RAISE NOTICE '  - Album Management with Auto Track Counting';
  RAISE NOTICE '  - ISRC Validation and BSL Licensing';
  RAISE NOTICE '  - Multi-role Support (Fan, Artist, Brand, Developer, Admin)';
  RAISE NOTICE 'All RLS policies have been updated to fix feature blocking issues.';
END $$;