-- ============================================================
-- Phase 15: Add job_id to drive_registrations
-- ============================================================
-- PROBLEM: The HR jobs feature allows students to register
-- for 'jobs' directly instead of 'placement_drives'. 
-- The API route attempts to insert 'job_id' into the 
-- 'drive_registrations' table, but the column does not exist.
--
-- FIX: Add job_id column, make it a foreign key to jobs,
-- and modify drive_id to be nullable since a registration
-- could be for EITHER a drive OR a job.
-- ============================================================

-- 1. Add job_id to drive_registrations
ALTER TABLE public.drive_registrations
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE;

-- 2. Make drive_id nullable if it isn't already, since registrations can be for jobs
ALTER TABLE public.drive_registrations
ALTER COLUMN drive_id DROP NOT NULL;

-- 3. Add a check constraint to ensure exactly one of drive_id or job_id is present
-- DROP the constraint first in case we need to re-run this
ALTER TABLE public.drive_registrations DROP CONSTRAINT IF EXISTS drive_or_job_check;
ALTER TABLE public.drive_registrations 
ADD CONSTRAINT drive_or_job_check 
CHECK (
  (drive_id IS NOT NULL AND job_id IS NULL) OR 
  (drive_id IS NULL AND job_id IS NOT NULL)
);
