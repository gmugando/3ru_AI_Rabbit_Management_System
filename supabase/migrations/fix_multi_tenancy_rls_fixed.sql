-- Fix Multi-Tenancy Issues - Ensure proper user filtering and RLS policies
-- This migration ensures that users can only access their own data
-- Fixed version to handle view conflicts properly

-- 1. Ensure all tables have RLS enabled and proper policies

-- Rabbits table - already has RLS, but let's verify and enhance
ALTER TABLE public.rabbits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own rabbits" ON public.rabbits;
DROP POLICY IF EXISTS "Users can insert their own rabbits" ON public.rabbits;
DROP POLICY IF EXISTS "Users can update their own rabbits" ON public.rabbits;
DROP POLICY IF EXISTS "Users can delete their own rabbits" ON public.rabbits;

-- Recreate policies with proper filtering
CREATE POLICY "Users can view their own rabbits" 
ON public.rabbits
FOR SELECT
USING (created_by = auth.uid() AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "Users can insert their own rabbits" 
ON public.rabbits
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own rabbits" 
ON public.rabbits
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own rabbits" 
ON public.rabbits
FOR DELETE
USING (created_by = auth.uid());

-- Breeding plans table - ensure RLS is enabled
ALTER TABLE public.breeding_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own breeding plans" ON public.breeding_plans;
DROP POLICY IF EXISTS "Users can insert their own breeding plans" ON public.breeding_plans;
DROP POLICY IF EXISTS "Users can update their own breeding plans" ON public.breeding_plans;
DROP POLICY IF EXISTS "Users can delete their own breeding plans" ON public.breeding_plans;

-- Create policies for breeding plans
CREATE POLICY "Users can view their own breeding plans" 
ON public.breeding_plans
FOR SELECT
USING (created_by = auth.uid() AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "Users can insert their own breeding plans" 
ON public.breeding_plans
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own breeding plans" 
ON public.breeding_plans
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own breeding plans" 
ON public.breeding_plans
FOR DELETE
USING (created_by = auth.uid());

-- Transactions table - ensure RLS is enabled
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions
FOR SELECT
USING (user_id = auth.uid() AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transactions" 
ON public.transactions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions
FOR DELETE
USING (user_id = auth.uid());

-- Health records table - ensure RLS is enabled
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can insert their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can update their own health records" ON public.health_records;
DROP POLICY IF EXISTS "Users can delete their own health records" ON public.health_records;

-- Create policies for health records
CREATE POLICY "Users can view their own health records" 
ON public.health_records
FOR SELECT
USING (user_id = auth.uid() AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "Users can insert their own health records" 
ON public.health_records
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own health records" 
ON public.health_records
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own health records" 
ON public.health_records
FOR DELETE
USING (user_id = auth.uid());

-- Weight records table - ensure RLS is enabled
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own weight records" ON public.weight_records;
DROP POLICY IF EXISTS "Users can insert their own weight records" ON public.weight_records;
DROP POLICY IF EXISTS "Users can update their own weight records" ON public.weight_records;
DROP POLICY IF EXISTS "Users can delete their own weight records" ON public.weight_records;

-- Create policies for weight records
CREATE POLICY "Users can view their own weight records" 
ON public.weight_records
FOR SELECT
USING (user_id = auth.uid() AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "Users can insert their own weight records" 
ON public.weight_records
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own weight records" 
ON public.weight_records
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own weight records" 
ON public.weight_records
FOR DELETE
USING (user_id = auth.uid());

-- Schedule events table - ensure RLS is enabled
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own schedule events" ON public.schedule_events;
DROP POLICY IF EXISTS "Users can insert their own schedule events" ON public.schedule_events;
DROP POLICY IF EXISTS "Users can update their own schedule events" ON public.schedule_events;
DROP POLICY IF EXISTS "Users can delete their own schedule events" ON public.schedule_events;

-- Create policies for schedule events
CREATE POLICY "Users can view their own schedule events" 
ON public.schedule_events
FOR SELECT
USING (user_id = auth.uid() AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "Users can insert their own schedule events" 
ON public.schedule_events
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own schedule events" 
ON public.schedule_events
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own schedule events" 
ON public.schedule_events
FOR DELETE
USING (user_id = auth.uid());

-- Kit records table - ensure RLS is enabled
ALTER TABLE public.kit_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own kit records" ON public.kit_records;
DROP POLICY IF EXISTS "Users can insert their own kit records" ON public.kit_records;
DROP POLICY IF EXISTS "Users can update their own kit records" ON public.kit_records;
DROP POLICY IF EXISTS "Users can delete their own kit records" ON public.kit_records;

-- Create policies for kit records
CREATE POLICY "Users can view their own kit records" 
ON public.kit_records
FOR SELECT
USING (created_by = auth.uid() AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "Users can insert their own kit records" 
ON public.kit_records
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own kit records" 
ON public.kit_records
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own kit records" 
ON public.kit_records
FOR DELETE
USING (created_by = auth.uid());

-- Kit health records table - ensure RLS is enabled
ALTER TABLE public.kit_health_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own kit health records" ON public.kit_health_records;
DROP POLICY IF EXISTS "Users can insert their own kit health records" ON public.kit_health_records;
DROP POLICY IF EXISTS "Users can update their own kit health records" ON public.kit_health_records;
DROP POLICY IF EXISTS "Users can delete their own kit health records" ON public.kit_health_records;

-- Create policies for kit health records
CREATE POLICY "Users can view their own kit health records" 
ON public.kit_health_records
FOR SELECT
USING (created_by = auth.uid() AND (is_deleted IS NULL OR is_deleted = false));

CREATE POLICY "Users can insert their own kit health records" 
ON public.kit_health_records
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own kit health records" 
ON public.kit_health_records
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own kit health records" 
ON public.kit_health_records
FOR DELETE
USING (created_by = auth.uid());

-- 2. Drop existing views first to avoid conflicts
DROP VIEW IF EXISTS public.health_records_with_rabbit;
DROP VIEW IF EXISTS public.weight_records_with_rabbit;
DROP VIEW IF EXISTS public.schedule_events_with_rabbit;

-- 3. Recreate views with proper user filtering

-- Create health_records_with_rabbit view with user filtering
CREATE VIEW public.health_records_with_rabbit AS
SELECT 
    hr.id,
    hr.created_at,
    hr.updated_at,
    hr.record_date,
    hr.record_type,
    hr.status,
    hr.condition,
    hr.severity,
    hr.affected_area,
    hr.symptoms,
    hr.treatment_type,
    hr.medication,
    hr.dosage,
    hr.frequency,
    hr.treatment_start_date,
    hr.treatment_duration,
    hr.treatment_end_date,
    hr.veterinarian,
    hr.cost,
    hr.notes,
    hr.follow_up_required,
    hr.follow_up_date,
    hr.follow_up_completed,
    hr.user_id,
    r.rabbit_id as rabbit_tag,
    r.name as rabbit_name,
    r.breed,
    r.gender,
    r.date_of_birth,
    -- Calculate age at record date
    (hr.record_date - r.date_of_birth) as age_at_record,
    -- Check if treatment is currently active
    CASE 
        WHEN hr.treatment_start_date IS NOT NULL AND hr.treatment_end_date IS NOT NULL 
        THEN CURRENT_DATE BETWEEN hr.treatment_start_date AND hr.treatment_end_date
        ELSE false
    END as treatment_active,
    -- Days remaining for treatment
    CASE 
        WHEN hr.treatment_end_date IS NOT NULL AND hr.treatment_end_date >= CURRENT_DATE
        THEN hr.treatment_end_date - CURRENT_DATE
        ELSE 0
    END as days_remaining
FROM public.health_records hr
JOIN public.rabbits r ON hr.rabbit_id = r.id
WHERE hr.is_deleted = false 
  AND r.is_deleted = false
  AND hr.user_id = auth.uid()
  AND r.created_by = auth.uid()
ORDER BY hr.record_date DESC;

-- Create weight_records_with_rabbit view with user filtering
CREATE VIEW public.weight_records_with_rabbit AS
SELECT 
    wr.id,
    wr.created_at,
    wr.updated_at,
    wr.measurement_date,
    wr.weight,
    wr.body_condition_score,
    wr.notes,
    wr.user_id,
    r.rabbit_id as rabbit_tag,
    r.name as rabbit_name,
    r.breed,
    r.gender,
    r.date_of_birth,
    -- Calculate age at measurement
    (wr.measurement_date - r.date_of_birth) as age_at_measurement
FROM public.weight_records wr
JOIN public.rabbits r ON wr.rabbit_id = r.id
WHERE wr.is_deleted = false 
  AND r.is_deleted = false
  AND wr.user_id = auth.uid()
  AND r.created_by = auth.uid()
ORDER BY wr.measurement_date DESC;

-- Create schedule_events_with_rabbit view with user filtering
CREATE VIEW public.schedule_events_with_rabbit AS
SELECT 
    se.*,
    r.rabbit_id as rabbit_tag,
    r.name as rabbit_name,
    r.breed as rabbit_breed,
    
    -- Calculate if event is overdue
    CASE 
        WHEN se.status = 'scheduled' AND se.start_date < CURRENT_DATE THEN true
        WHEN se.status = 'scheduled' AND se.start_date = CURRENT_DATE AND se.start_time < CURRENT_TIME THEN true
        ELSE false
    END as is_overdue,
    
    -- Calculate days until event
    (se.start_date - CURRENT_DATE) as days_until,
    
    -- Format display date/time
    CASE 
        WHEN se.all_day THEN se.start_date::text
        WHEN se.start_time IS NOT NULL THEN (se.start_date::text || ' ' || se.start_time::text)
        ELSE se.start_date::text
    END as formatted_datetime
    
FROM public.schedule_events se
LEFT JOIN public.rabbits r ON se.rabbit_id = r.id
WHERE se.is_deleted = false
  AND (r.id IS NULL OR r.is_deleted = false)
  AND se.user_id = auth.uid()
  AND (r.id IS NULL OR r.created_by = auth.uid());

-- 4. Add helpful comments
COMMENT ON TABLE public.rabbits IS 'Rabbit information for each user - RLS enabled for multi-tenancy';
COMMENT ON TABLE public.breeding_plans IS 'Breeding plans for each user - RLS enabled for multi-tenancy';
COMMENT ON TABLE public.transactions IS 'Financial transactions for each user - RLS enabled for multi-tenancy';
COMMENT ON TABLE public.health_records IS 'Health records for each user - RLS enabled for multi-tenancy';
COMMENT ON TABLE public.weight_records IS 'Weight records for each user - RLS enabled for multi-tenancy';
COMMENT ON TABLE public.schedule_events IS 'Schedule events for each user - RLS enabled for multi-tenancy';
COMMENT ON TABLE public.kit_records IS 'Kit records for each user - RLS enabled for multi-tenancy';
COMMENT ON TABLE public.kit_health_records IS 'Kit health records for each user - RLS enabled for multi-tenancy';

-- 5. Create a function to get user statistics (for dashboard)
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(user_uuid UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_rabbits', (
            SELECT COUNT(*) 
            FROM public.rabbits 
            WHERE created_by = user_uuid 
              AND (is_deleted IS NULL OR is_deleted = false)
        ),
        'active_rabbits', (
            SELECT COUNT(*) 
            FROM public.rabbits 
            WHERE created_by = user_uuid 
              AND status = 'active'
              AND (is_deleted IS NULL OR is_deleted = false)
        ),
        'breeding_pairs', (
            SELECT COUNT(*) 
            FROM public.breeding_plans 
            WHERE created_by = user_uuid 
              AND status = 'Active'
              AND (is_deleted IS NULL OR is_deleted = false)
              AND doe_id IS NOT NULL 
              AND buck_id IS NOT NULL
        ),
        'expected_births', (
            SELECT COUNT(*) 
            FROM public.breeding_plans 
            WHERE created_by = user_uuid 
              AND status = 'Active'
              AND (is_deleted IS NULL OR is_deleted = false)
              AND expected_kindle_date >= CURRENT_DATE
              AND expected_kindle_date < CURRENT_DATE + INTERVAL '1 month'
        ),
        'monthly_expenses', (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.transactions 
            WHERE user_id = user_uuid 
              AND type = 'expense'
              AND (is_deleted IS NULL OR is_deleted = false)
              AND date >= DATE_TRUNC('month', CURRENT_DATE)
              AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats(UUID) TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.get_user_dashboard_stats(UUID) IS 'Get dashboard statistics for a specific user - includes proper multi-tenancy filtering';
