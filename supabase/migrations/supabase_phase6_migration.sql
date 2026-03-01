-- Phase 6: Multi-Layer Eligibility Architecture Schema Updates
-- Please run this script in your Supabase SQL Editor.

-- 1. Add academic criteria fields to placement_drives table
ALTER TABLE public.placement_drives 
ADD COLUMN IF NOT EXISTS min_cgpa NUMERIC,
ADD COLUMN IF NOT EXISTS max_backlogs INTEGER,
ADD COLUMN IF NOT EXISTS allowed_branches TEXT[];

-- 2. Add permanent academic fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenth_percent NUMERIC,
ADD COLUMN IF NOT EXISTS twelfth_percent NUMERIC,
ADD COLUMN IF NOT EXISTS grad_cgpa NUMERIC,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS active_backlogs INTEGER;

-- 3. Add rejection logic to interviews table
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
