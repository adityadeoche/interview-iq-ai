-- Phase 10: Enhance HR Jobs table with full academic eligibility criteria
-- Run this in Supabase SQL Editor

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS min_10th NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_12th NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_backlogs INTEGER DEFAULT 99,
  ADD COLUMN IF NOT EXISTS allowed_branches TEXT[] DEFAULT '{}';
