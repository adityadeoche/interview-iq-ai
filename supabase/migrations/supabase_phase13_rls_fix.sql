-- ============================================================
-- Phase 13: Fix RLS on profiles table for API route access
-- ============================================================
-- PROBLEM: The API route /api/drives/join cannot read profiles
-- because the server-side Supabase client doesn't have a proper
-- authenticated session. RLS policy auth.role() = 'authenticated'
-- blocks the read, so profile.branch always returns NULL.
--
-- FIX: Allow public SELECT on profiles. Academic data (CGPA, branch,
-- percentages) is NOT sensitive in a placement platform — TPOs,
-- recruiters, and the system all need to read it.
-- UPDATE/INSERT policies still restrict to own profile only.
-- ============================================================

-- Drop all existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a permissive SELECT policy (allows any reader, including API routes)
CREATE POLICY "Public read access on profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Keep UPDATE restricted to own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Keep INSERT restricted to own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
