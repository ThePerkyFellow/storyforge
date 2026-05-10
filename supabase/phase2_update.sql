-- Run this in your Supabase SQL Editor to update your existing database for Phase 2
-- It will safely add the new column without breaking existing data.

ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS allow_alternatives boolean default true;
