-- Phase 11 Migration: Adding passing_year to profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS passing_year integer;
