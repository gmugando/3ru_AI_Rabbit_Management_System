-- Enhancement to feeding_schedules table
-- Adding additional useful fields for better schedule management

-- Add new columns for enhanced functionality (without the problematic foreign key first)
ALTER TABLE public.feeding_schedules 
ADD COLUMN IF NOT EXISTS amount DECIMAL(8, 2) CHECK (amount > 0),
ADD COLUMN IF NOT EXISTS amount_unit TEXT DEFAULT 'kg' CHECK (amount_unit IN ('kg', 'g', 'lbs', 'cups')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_due_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_of_week INTEGER[] CHECK (array_length(days_of_week, 1) IS NULL OR (array_length(days_of_week, 1) > 0 AND days_of_week <@ ARRAY[1,2,3,4,5,6,7])),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS schedule_template_id UUID,
ADD COLUMN IF NOT EXISTS auto_create_records BOOLEAN DEFAULT false;

-- Add comments for new columns
COMMENT ON COLUMN public.feeding_schedules.amount IS 'Amount of feed per feeding session';
COMMENT ON COLUMN public.feeding_schedules.amount_unit IS 'Unit of measurement for amount (kg, g, lbs, cups)';
COMMENT ON COLUMN public.feeding_schedules.is_active IS 'Whether the schedule is currently active';
COMMENT ON COLUMN public.feeding_schedules.last_executed_at IS 'When this schedule was last executed';
COMMENT ON COLUMN public.feeding_schedules.next_due_at IS 'When this schedule is next due to be executed';
COMMENT ON COLUMN public.feeding_schedules.execution_count IS 'How many times this schedule has been executed';
COMMENT ON COLUMN public.feeding_schedules.days_of_week IS 'Array of days of week (1=Monday, 7=Sunday) for weekly schedules';
COMMENT ON COLUMN public.feeding_schedules.start_date IS 'When this schedule becomes active';
COMMENT ON COLUMN public.feeding_schedules.end_date IS 'When this schedule expires (optional)';
COMMENT ON COLUMN public.feeding_schedules.priority IS 'Priority level of this feeding schedule';
COMMENT ON COLUMN public.feeding_schedules.schedule_template_id IS 'Reference to template schedule if this was created from a template';
COMMENT ON COLUMN public.feeding_schedules.auto_create_records IS 'Whether to automatically create feed records when executed';

-- Add foreign key constraint for schedule_template_id (after ensuring column exists)
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feeding_schedules_schedule_template_id_fkey'
        AND table_name = 'feeding_schedules'
    ) THEN
        -- Add the foreign key constraint only if both columns are UUID type
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'feeding_schedules' AND column_name = 'id'
        ) = 'uuid' AND (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'feeding_schedules' AND column_name = 'schedule_template_id'
        ) = 'uuid' THEN
            ALTER TABLE public.feeding_schedules 
            ADD CONSTRAINT feeding_schedules_schedule_template_id_fkey 
            FOREIGN KEY (schedule_template_id) REFERENCES public.feeding_schedules(id);
        END IF;
    END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS feeding_schedules_is_active_idx ON public.feeding_schedules(is_active);
CREATE INDEX IF NOT EXISTS feeding_schedules_next_due_at_idx ON public.feeding_schedules(next_due_at);
CREATE INDEX IF NOT EXISTS feeding_schedules_priority_idx ON public.feeding_schedules(priority);
CREATE INDEX IF NOT EXISTS feeding_schedules_start_date_idx ON public.feeding_schedules(start_date);
CREATE INDEX IF NOT EXISTS feeding_schedules_template_id_idx ON public.feeding_schedules(schedule_template_id);

-- Create a function to calculate next due date
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(
    schedule_time TIME,
    frequency TEXT,
    days_of_week INTEGER[],
    last_executed TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    start_date_param DATE DEFAULT NULL
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    base_date DATE;
    next_date DATE;
    result_timestamp TIMESTAMP WITH TIME ZONE;
    today_date DATE := CURRENT_DATE;
    current_time TIME := CURRENT_TIME;
    day_of_week INTEGER;
    next_day INTEGER;
    days_to_add INTEGER;
    i INTEGER;
BEGIN
    -- Determine base date
    IF last_executed IS NOT NULL THEN
        base_date := last_executed::DATE;
    ELSIF start_date_param IS NOT NULL THEN
        base_date := start_date_param;
    ELSE
        base_date := today_date;
    END IF;
    
    -- Calculate next date based on frequency
    CASE frequency
        WHEN 'daily' THEN
            next_date := base_date + INTERVAL '1 day';
            -- If today and time hasn't passed yet, use today
            IF base_date = today_date AND schedule_time > current_time THEN
                next_date := today_date;
            END IF;
            
        WHEN 'weekly' THEN
            IF days_of_week IS NOT NULL AND array_length(days_of_week, 1) > 0 THEN
                -- Find next day in the days_of_week array
                day_of_week := EXTRACT(dow FROM base_date + INTERVAL '1 day');
                IF day_of_week = 0 THEN day_of_week := 7; END IF; -- Convert Sunday from 0 to 7
                
                days_to_add := NULL;
                FOR i IN 1..7 LOOP
                    next_day := ((day_of_week + i - 2) % 7) + 1;
                    IF next_day = ANY(days_of_week) THEN
                        days_to_add := i;
                        EXIT;
                    END IF;
                END LOOP;
                
                IF days_to_add IS NULL THEN
                    days_to_add := 7; -- Default to 7 days if no valid day found
                END IF;
                
                next_date := base_date + days_to_add;
            ELSE
                next_date := base_date + INTERVAL '7 days';
            END IF;
            
        WHEN 'biweekly' THEN
            next_date := base_date + INTERVAL '14 days';
            
        WHEN 'monthly' THEN
            next_date := base_date + INTERVAL '1 month';
            
        ELSE
            next_date := base_date + INTERVAL '1 day';
    END CASE;
    
    -- Combine date and time
    result_timestamp := next_date + schedule_time;
    
    RETURN result_timestamp;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update next_due_at when schedule is modified
CREATE OR REPLACE FUNCTION public.update_feeding_schedule_next_due()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate next due date when schedule is created or updated
    NEW.next_due_at := public.calculate_next_due_date(
        NEW.time,
        NEW.frequency,
        NEW.days_of_week,
        NEW.last_executed_at,
        NEW.start_date
    );
    
    -- Set start_date to today if not provided
    IF NEW.start_date IS NULL THEN
        NEW.start_date := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update next_due_at
DROP TRIGGER IF EXISTS set_feeding_schedule_next_due ON public.feeding_schedules;
CREATE TRIGGER set_feeding_schedule_next_due
    BEFORE INSERT OR UPDATE ON public.feeding_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_feeding_schedule_next_due();

-- Create schedule execution log table (without foreign key constraints first)
CREATE TABLE IF NOT EXISTS public.feeding_schedule_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    schedule_id UUID NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_by UUID NOT NULL,
    feed_record_id UUID,
    amount_fed DECIMAL(8, 2),
    notes TEXT,
    execution_status TEXT DEFAULT 'completed' CHECK (execution_status IN ('completed', 'partial', 'skipped', 'failed')),
    user_id UUID NOT NULL
);

-- Add foreign key constraints safely for schedule executions
DO $$
BEGIN
    -- Add foreign key to feeding_schedules if types are compatible
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feeding_schedule_executions_schedule_id_fkey'
        AND table_name = 'feeding_schedule_executions'
    ) THEN
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'feeding_schedules' AND column_name = 'id'
        ) = (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'feeding_schedule_executions' AND column_name = 'schedule_id'
        ) THEN
            ALTER TABLE public.feeding_schedule_executions 
            ADD CONSTRAINT feeding_schedule_executions_schedule_id_fkey 
            FOREIGN KEY (schedule_id) REFERENCES public.feeding_schedules(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key to auth.users for executed_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feeding_schedule_executions_executed_by_fkey'
        AND table_name = 'feeding_schedule_executions'
    ) THEN
        ALTER TABLE public.feeding_schedule_executions 
        ADD CONSTRAINT feeding_schedule_executions_executed_by_fkey 
        FOREIGN KEY (executed_by) REFERENCES auth.users(id);
    END IF;

    -- Add foreign key to feed_records if types are compatible
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feeding_schedule_executions_feed_record_id_fkey'
        AND table_name = 'feeding_schedule_executions'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'feed_records'
        ) THEN
            IF (
                SELECT data_type FROM information_schema.columns 
                WHERE table_name = 'feed_records' AND column_name = 'id'
            ) = (
                SELECT data_type FROM information_schema.columns 
                WHERE table_name = 'feeding_schedule_executions' AND column_name = 'feed_record_id'
            ) THEN
                ALTER TABLE public.feeding_schedule_executions 
                ADD CONSTRAINT feeding_schedule_executions_feed_record_id_fkey 
                FOREIGN KEY (feed_record_id) REFERENCES public.feed_records(id);
            END IF;
        END IF;
    END IF;

    -- Add foreign key to auth.users for user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feeding_schedule_executions_user_id_fkey'
        AND table_name = 'feeding_schedule_executions'
    ) THEN
        ALTER TABLE public.feeding_schedule_executions 
        ADD CONSTRAINT feeding_schedule_executions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add RLS for schedule executions
ALTER TABLE public.feeding_schedule_executions ENABLE ROW LEVEL SECURITY;

-- Policies for schedule executions
CREATE POLICY "Users can view their own schedule executions"
    ON public.feeding_schedule_executions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule executions"
    ON public.feeding_schedule_executions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND auth.uid() = executed_by);

CREATE POLICY "Users can update their own schedule executions"
    ON public.feeding_schedule_executions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes for schedule executions
CREATE INDEX feeding_schedule_executions_schedule_id_idx ON public.feeding_schedule_executions(schedule_id);
CREATE INDEX feeding_schedule_executions_user_id_idx ON public.feeding_schedule_executions(user_id);
CREATE INDEX feeding_schedule_executions_executed_at_idx ON public.feeding_schedule_executions(executed_at);

-- Add comment
COMMENT ON TABLE public.feeding_schedule_executions IS 'Log of feeding schedule executions';

-- Create a function to mark schedule as executed
CREATE OR REPLACE FUNCTION public.execute_feeding_schedule(
    schedule_id_param UUID,
    amount_fed_param DECIMAL DEFAULT NULL,
    notes_param TEXT DEFAULT NULL,
    create_feed_record BOOLEAN DEFAULT false,
    feed_brand_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    schedule_record RECORD;
    execution_id UUID;
    feed_record_id UUID := NULL;
    current_user_id UUID;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get schedule details
    SELECT * INTO schedule_record
    FROM public.feeding_schedules
    WHERE id = schedule_id_param AND user_id = current_user_id AND is_deleted = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Schedule not found or access denied';
    END IF;
    
    -- Create feed record if requested and amount is provided
    IF create_feed_record AND (amount_fed_param IS NOT NULL OR schedule_record.amount IS NOT NULL) THEN
        INSERT INTO public.feed_records (
            user_id,
            feed_type,
            feed_brand,
            record_type,
            amount,
            date,
            sections,
            notes
        ) VALUES (
            current_user_id,
            schedule_record.feed_type,
            COALESCE(feed_brand_param, 'Schedule Auto-Feed'),
            'consumption',
            COALESCE(amount_fed_param, schedule_record.amount),
            CURRENT_DATE,
            schedule_record.sections,
            CONCAT('Auto-generated from schedule: ', schedule_record.name, 
                   CASE WHEN notes_param IS NOT NULL THEN '. ' || notes_param ELSE '' END)
        ) RETURNING id INTO feed_record_id;
    END IF;
    
    -- Create execution log
    INSERT INTO public.feeding_schedule_executions (
        schedule_id,
        executed_at,
        executed_by,
        feed_record_id,
        amount_fed,
        notes,
        user_id
    ) VALUES (
        schedule_id_param,
        NOW(),
        current_user_id,
        feed_record_id,
        COALESCE(amount_fed_param, schedule_record.amount),
        notes_param,
        current_user_id
    ) RETURNING id INTO execution_id;
    
    -- Update schedule with last execution and increment count
    UPDATE public.feeding_schedules
    SET 
        last_executed_at = NOW(),
        execution_count = execution_count + 1,
        next_due_at = public.calculate_next_due_date(
            time,
            frequency,
            days_of_week,
            NOW(),
            start_date
        ),
        updated_at = NOW()
    WHERE id = schedule_id_param;
    
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_feeding_schedule TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_next_due_date TO authenticated;

-- Create view for overdue schedules
CREATE OR REPLACE VIEW public.overdue_feeding_schedules AS
SELECT 
    fs.*,
    EXTRACT(EPOCH FROM (NOW() - fs.next_due_at)) / 3600 AS hours_overdue
FROM public.feeding_schedules fs
WHERE 
    fs.is_active = true 
    AND fs.is_deleted = false
    AND fs.next_due_at < NOW()
    AND (fs.end_date IS NULL OR fs.end_date >= CURRENT_DATE);

-- Create view for upcoming schedules (next 24 hours)
CREATE OR REPLACE VIEW public.upcoming_feeding_schedules AS
SELECT 
    fs.*,
    EXTRACT(EPOCH FROM (fs.next_due_at - NOW())) / 3600 AS hours_until_due
FROM public.feeding_schedules fs
WHERE 
    fs.is_active = true 
    AND fs.is_deleted = false
    AND fs.next_due_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
    AND (fs.end_date IS NULL OR fs.end_date >= CURRENT_DATE)
ORDER BY fs.next_due_at ASC;
