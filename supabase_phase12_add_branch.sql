-- Phase 12: Add missing academic branch column to profiles
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT NULL;
