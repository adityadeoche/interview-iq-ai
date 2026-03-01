-- Phase 9: Add job_code to HR jobs table
-- Run this in Supabase SQL Editor

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS job_code TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS company_name_display TEXT DEFAULT NULL;

-- Add unique constraint on job_code
CREATE UNIQUE INDEX IF NOT EXISTS jobs_job_code_unique ON public.jobs (job_code) WHERE job_code IS NOT NULL;
