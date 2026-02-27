-- =============================================================================
-- ADD MISSING MEDIA COLUMNS TO EVENTS TABLE
-- Migration: 011_add_event_media_columns.sql
-- Date: November 23, 2025
-- Purpose: Add cover_image_url and other media columns if they don't exist
-- =============================================================================

-- Add cover_image_url column if it doesn't exist
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add video_url column if it doesn't exist (may already exist from previous migration)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add video_thumbnail_url column if it doesn't exist
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- Add banner_settings column if it doesn't exist
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS banner_settings JSONB DEFAULT '{"applyToBackground": false, "overlayOpacity": 0.5}';

-- Add comments
COMMENT ON COLUMN events.cover_image_url IS 'URL to event cover/banner image';
COMMENT ON COLUMN events.video_url IS 'URL to event promo/highlight video';
COMMENT ON COLUMN events.video_thumbnail_url IS 'Thumbnail for video player';
COMMENT ON COLUMN events.banner_settings IS 'Settings for banner display: applyToBackground, overlayOpacity, etc.';

