-- Fix breeding plans status case to match database constraint
-- Convert any uppercase status values to lowercase

UPDATE public.breeding_plans 
SET status = LOWER(status)
WHERE status IN ('Planned', 'Active', 'Completed', 'Cancelled', 'Failed');

-- Also update any other variations that might exist
UPDATE public.breeding_plans 
SET status = 'planned'
WHERE status = 'PLANNED';

UPDATE public.breeding_plans 
SET status = 'active'
WHERE status = 'ACTIVE';

UPDATE public.breeding_plans 
SET status = 'completed'
WHERE status = 'COMPLETED';

UPDATE public.breeding_plans 
SET status = 'cancelled'
WHERE status = 'CANCELLED';

UPDATE public.breeding_plans 
SET status = 'failed'
WHERE status = 'FAILED';
