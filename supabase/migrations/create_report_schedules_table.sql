-- Create report_schedules table for automated report generation and delivery
CREATE TABLE IF NOT EXISTS public.report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Schedule details
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL CHECK (report_type IN ('population', 'health', 'financial', 'breeding', 'feeding', 'comprehensive')),
    
    -- Scheduling configuration
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    frequency_config JSONB, -- For weekly: {"day": "monday"}, monthly: {"day": 1}, etc.
    time_of_day TIME DEFAULT '09:00:00',
    timezone TEXT DEFAULT 'UTC',
    
    -- Delivery configuration
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'dashboard', 'both')),
    email_recipients TEXT[], -- Array of email addresses
    include_attachments BOOLEAN DEFAULT true,
    attachment_format TEXT DEFAULT 'pdf' CHECK (attachment_format IN ('pdf', 'excel', 'both')),
    
    -- Report configuration
    report_period INTEGER DEFAULT 6, -- Number of months to include
    include_charts BOOLEAN DEFAULT true,
    include_recommendations BOOLEAN DEFAULT true,
    custom_filters JSONB, -- Additional filters for the report
    
    -- Status and control
    is_active BOOLEAN DEFAULT true,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    next_generation_at TIMESTAMP WITH TIME ZONE,
    generation_count INTEGER DEFAULT 0,
    
    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own report schedules" ON public.report_schedules
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own report schedules" ON public.report_schedules
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own report schedules" ON public.report_schedules
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own report schedules" ON public.report_schedules
    FOR DELETE USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_report_schedules_user_id ON public.report_schedules(user_id);
CREATE INDEX idx_report_schedules_next_generation ON public.report_schedules(next_generation_at) WHERE is_active = true;
CREATE INDEX idx_report_schedules_report_type ON public.report_schedules(report_type);
CREATE INDEX idx_report_schedules_frequency ON public.report_schedules(frequency);

-- Create report_executions table to track generated reports
CREATE TABLE IF NOT EXISTS public.report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Execution details
    schedule_id UUID NOT NULL REFERENCES public.report_schedules(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    generation_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    generation_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Report data
    report_data JSONB, -- The actual report data
    file_path TEXT, -- Path to generated file if saved
    file_size INTEGER, -- Size of generated file in bytes
    
    -- Delivery tracking
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
    delivery_method TEXT NOT NULL,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_recipients TEXT[],
    delivery_error TEXT,
    
    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS for report_executions
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_executions
CREATE POLICY "Users can view their own report executions" ON public.report_executions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own report executions" ON public.report_executions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own report executions" ON public.report_executions
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Indexes for report_executions
CREATE INDEX idx_report_executions_schedule_id ON public.report_executions(schedule_id);
CREATE INDEX idx_report_executions_user_id ON public.report_executions(user_id);
CREATE INDEX idx_report_executions_created_at ON public.report_executions(created_at);
CREATE INDEX idx_report_executions_delivery_status ON public.report_executions(delivery_status);

-- Function to calculate next generation date
CREATE OR REPLACE FUNCTION public.calculate_next_report_generation(
    frequency_param TEXT,
    frequency_config_param JSONB DEFAULT NULL,
    time_of_day_param TIME DEFAULT '09:00:00',
    timezone_param TEXT DEFAULT 'UTC',
    from_date_param TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_date DATE;
    next_timestamp TIMESTAMP WITH TIME ZONE;
    day_of_week INTEGER;
    day_of_month INTEGER;
BEGIN
    -- Convert to the specified timezone
    next_timestamp := from_date_param AT TIME ZONE timezone_param;
    
    CASE frequency_param
        WHEN 'daily' THEN
            next_date := (next_timestamp::DATE + INTERVAL '1 day')::DATE;
            
        WHEN 'weekly' THEN
            -- Default to Monday if no day specified
            day_of_week := COALESCE((frequency_config_param->>'day')::INTEGER, 1);
            -- Find next occurrence of the specified day
            next_date := next_timestamp::DATE + 
                ((day_of_week - EXTRACT(DOW FROM next_timestamp::DATE) + 7) % 7)::INTEGER;
            -- If today is the target day and time hasn't passed, use today
            IF EXTRACT(DOW FROM next_timestamp::DATE) = day_of_week AND 
               next_timestamp::TIME < time_of_day_param THEN
                next_date := next_timestamp::DATE;
            ELSE
                next_date := next_date + INTERVAL '7 days';
            END IF;
            
        WHEN 'monthly' THEN
            -- Default to 1st of month if no day specified
            day_of_month := COALESCE((frequency_config_param->>'day')::INTEGER, 1);
            -- Start with 1st of next month
            next_date := (DATE_TRUNC('month', next_timestamp::DATE) + INTERVAL '1 month')::DATE;
            -- Adjust to specified day of month
            next_date := next_date + (day_of_month - 1);
            -- If today is the target day and time hasn't passed, use today
            IF EXTRACT(DAY FROM next_timestamp::DATE) = day_of_month AND 
               next_timestamp::TIME < time_of_day_param THEN
                next_date := next_timestamp::DATE;
            END IF;
            
        WHEN 'quarterly' THEN
            -- Default to 1st day of quarter
            day_of_month := COALESCE((frequency_config_param->>'day')::INTEGER, 1);
            -- Find next quarter start
            next_date := (DATE_TRUNC('quarter', next_timestamp::DATE) + INTERVAL '3 months')::DATE;
            -- Adjust to specified day
            next_date := next_date + (day_of_month - 1);
            
        WHEN 'yearly' THEN
            -- Default to January 1st
            day_of_month := COALESCE((frequency_config_param->>'day')::INTEGER, 1);
            -- Find next year start
            next_date := (DATE_TRUNC('year', next_timestamp::DATE) + INTERVAL '1 year')::DATE;
            -- Adjust to specified day
            next_date := next_date + (day_of_month - 1);
            
        ELSE
            next_date := next_timestamp::DATE + INTERVAL '1 day';
    END CASE;
    
    -- Combine date with time and convert back to UTC
    RETURN (next_date + time_of_day_param) AT TIME ZONE timezone_param AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql;

-- Function to get schedules due for generation
CREATE OR REPLACE FUNCTION public.get_due_report_schedules()
RETURNS TABLE (
    id UUID,
    name TEXT,
    report_type TEXT,
    frequency TEXT,
    delivery_method TEXT,
    email_recipients TEXT[],
    user_id UUID,
    report_period INTEGER,
    include_charts BOOLEAN,
    include_recommendations BOOLEAN,
    custom_filters JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.id,
        rs.name,
        rs.report_type,
        rs.frequency,
        rs.delivery_method,
        rs.email_recipients,
        rs.user_id,
        rs.report_period,
        rs.include_charts,
        rs.include_recommendations,
        rs.custom_filters
    FROM public.report_schedules rs
    WHERE 
        rs.is_active = true
        AND rs.is_deleted = false
        AND rs.next_generation_at <= NOW()
        AND rs.next_generation_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update next generation date after execution
CREATE OR REPLACE FUNCTION public.update_report_schedule_after_execution(
    schedule_id_param UUID,
    execution_id_param UUID
)
RETURNS VOID AS $$
DECLARE
    schedule_record RECORD;
BEGIN
    -- Get schedule details
    SELECT * INTO schedule_record
    FROM public.report_schedules
    WHERE id = schedule_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Schedule not found';
    END IF;
    
    -- Update schedule with next generation date and increment count
    UPDATE public.report_schedules
    SET 
        last_generated_at = NOW(),
        next_generation_at = public.calculate_next_report_generation(
            frequency,
            frequency_config,
            time_of_day,
            timezone,
            NOW()
        ),
        generation_count = generation_count + 1,
        updated_at = NOW()
    WHERE id = schedule_id_param;
    
    -- Update execution record
    UPDATE public.report_executions
    SET 
        generation_completed_at = NOW(),
        delivery_status = CASE 
            WHEN schedule_record.delivery_method IN ('email', 'both') THEN 'pending'
            ELSE 'sent'
        END
    WHERE id = execution_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_next_report_generation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_due_report_schedules TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_report_schedule_after_execution TO authenticated;

-- Add comments
COMMENT ON TABLE public.report_schedules IS 'Automated report generation schedules';
COMMENT ON TABLE public.report_executions IS 'Track report generation and delivery history';
COMMENT ON FUNCTION public.calculate_next_report_generation IS 'Calculate next report generation date based on frequency';
COMMENT ON FUNCTION public.get_due_report_schedules IS 'Get all schedules that are due for generation';
COMMENT ON FUNCTION public.update_report_schedule_after_execution IS 'Update schedule after successful report generation';
