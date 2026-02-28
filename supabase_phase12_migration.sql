-- Phase 12 Migration: Adding skills array to profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
