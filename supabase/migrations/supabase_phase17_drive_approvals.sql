-- 1. Add status and slot time to drive_registrations
ALTER TABLE public.drive_registrations
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS scheduled_time timestamp with time zone;

-- 2. Add drive_id to interviews (to link a mock interview with a drive)
ALTER TABLE public.interviews
ADD COLUMN IF NOT EXISTS drive_id uuid REFERENCES public.placement_drives(id),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Completed'; -- e.g., 'Screened Out'

-- 3. Add results_published to placement_drives
ALTER TABLE public.placement_drives
ADD COLUMN IF NOT EXISTS results_published boolean DEFAULT false;
