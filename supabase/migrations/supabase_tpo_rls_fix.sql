-- Fix for the "Unknown" / "No email" bug in the TPO Dashboard
-- This policy allows TPOs (or any authenticated user) to view basic profile data 
-- of students so they can appear in the Drive Registrations tables.

-- Drop any conflicting overly-restrictive view policy if it exists (optional safety measure)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a policy that allows authenticated users to read profiles
-- (Note: They still can only UPDATE their own profiles as per other policies)
CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');
