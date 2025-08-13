-- Drop feeding-related tables and objects to start fresh
-- This allows for clean migration execution

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS public.feeding_schedule_performance CASCADE;
DROP VIEW IF EXISTS public.overdue_feeding_schedules CASCADE;
DROP VIEW IF EXISTS public.upcoming_feeding_schedules CASCADE;

-- Drop functions that depend on tables
DROP FUNCTION IF EXISTS public.calculate_next_due_date(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.execute_feeding_schedule(UUID, UUID, DECIMAL, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_feeding_schedule_summary(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_schedule_history(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.bulk_update_schedule_status(UUID[], BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.get_upcoming_schedules(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.create_feed_record_from_schedule(UUID, UUID, DECIMAL, TEXT) CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_feeding_schedule_next_due ON public.feeding_schedules CASCADE;
DROP TRIGGER IF EXISTS handle_schedule_deletion_trigger ON public.feeding_schedules CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON public.feeding_schedules CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON public.feeding_schedule_executions CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.update_feeding_schedule_next_due() CASCADE;
DROP FUNCTION IF EXISTS public.handle_schedule_deletion() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.feeding_schedule_executions CASCADE;

-- Remove schedule_id column from feed_records if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feed_records' 
        AND column_name = 'schedule_id'
        AND table_schema = 'public'
    ) THEN
        -- Drop foreign key constraint first
        ALTER TABLE public.feed_records DROP CONSTRAINT IF EXISTS feed_records_schedule_id_fkey;
        -- Drop the column
        ALTER TABLE public.feed_records DROP COLUMN IF EXISTS schedule_id;
    END IF;
END $$;

-- Finally drop the main table
DROP TABLE IF EXISTS public.feeding_schedules CASCADE;

-- Clean up any remaining objects
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
