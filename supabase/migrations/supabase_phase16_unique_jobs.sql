-- ============================================================
-- Phase 16: Enforce unique job registrations
-- ============================================================
-- PROBLEM: A candidate can register for the same HR job multiple times
-- because the unique constraint on `drive_registrations`
-- only covers `(drive_id, student_id)`.
--
-- FIX: Delete duplicate job registrations, then add a unique
-- constraint on `(job_id, student_id)`.
-- ============================================================

-- 1. Delete duplicate registrations keeping the oldest one
DELETE FROM public.drive_registrations a USING (
    SELECT MIN(ctid) as ctid, job_id, student_id
    FROM public.drive_registrations
    WHERE job_id IS NOT NULL
    GROUP BY job_id, student_id
    HAVING COUNT(*) > 1
) b
WHERE a.job_id = b.job_id 
  AND a.student_id = b.student_id 
  AND a.ctid <> b.ctid;

-- 2. Add the unique constraint so students can only register once per job
ALTER TABLE public.drive_registrations DROP CONSTRAINT IF EXISTS unique_job_registration;
ALTER TABLE public.drive_registrations 
  ADD CONSTRAINT unique_job_registration UNIQUE (job_id, student_id);
