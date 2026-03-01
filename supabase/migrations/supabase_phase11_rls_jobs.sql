-- Phase 11: Fix RLS on `jobs` table to allow students to fetch HR job details
-- Run this in Supabase SQL Editor

-- Ensure RLS is enabled on the table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read jobs (so students can see them and join them)
CREATE POLICY "Allow public read access to jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (true);

-- Allow recruiters to insert jobs (already exists, but just in case)
CREATE POLICY "Allow recruiters to insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = recruiter_id);

-- Allow recruiters to update their own jobs
CREATE POLICY "Allow recruiters to update own jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = recruiter_id);

-- Allow recruiters to delete their own jobs
CREATE POLICY "Allow recruiters to delete own jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (auth.uid() = recruiter_id);
