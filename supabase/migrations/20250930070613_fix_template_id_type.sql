-- Fix template_id column to accept TEXT instead of UUID for MVP system

-- Alter the template_id column in event_scores to accept TEXT
ALTER TABLE public.event_scores
ALTER COLUMN template_id TYPE TEXT;