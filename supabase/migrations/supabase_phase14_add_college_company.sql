-- ============================================================
-- Phase 14: Add college_name and company_name to profiles
-- ============================================================
-- PROBLEM: The frontend allows TPOs to set their `college_name`
-- and recruiters to set their `company_name` during signup,
-- but these columns do not exist in the `profiles` table.
-- This causes signup and profile settings updates to fail
-- with the "column college_name does not exist" error.
--
-- FIX: Add the missing columns to the `profiles` table.
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS college_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;
