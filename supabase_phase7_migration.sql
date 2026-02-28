-- ============================================================
-- Phase 7: Full System Integration Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add missing academic criteria columns to placement_drives table
ALTER TABLE public.placement_drives
  ADD COLUMN IF NOT EXISTS min_10th NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_12th NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_cgpa NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_backlogs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS required_year INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS allowed_branches TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_roles TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS expected_intake INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ DEFAULT NULL;

-- 2. Add academic credential columns to profiles if not already present
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenth_percent NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS twelfth_percent NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS grad_cgpa NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS active_backlogs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pass_out_year INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT NULL;

-- 3. RLS: Allow authenticated users (incl. TPOs) to read profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Keep own-update restriction (users can only update their own profile)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. Allow upsert/insert on own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);
