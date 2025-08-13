-- Create schedule_events table for farm activity scheduling
CREATE TABLE IF NOT EXISTS public.schedule_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('breeding', 'feeding', 'health', 'maintenance', 'general')),
    
    -- Date and time
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    all_day BOOLEAN DEFAULT false,
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    recurrence_interval INTEGER DEFAULT 1, -- Every X days/weeks/months
    recurrence_days TEXT[], -- For weekly: ['monday', 'wednesday', 'friday']
    recurrence_end_date DATE,
    
    -- Priority and status
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
    
    -- Associations
    rabbit_id UUID REFERENCES public.rabbits(id) ON DELETE SET NULL,
    related_record_id UUID, -- Can link to health_records, breeding_records, etc.
    related_record_type TEXT, -- 'health_record', 'breeding_record', etc.
    
    -- Assignment
    assigned_to TEXT, -- Staff member or caretaker name
    location TEXT, -- Cage section, area, etc.
    
    -- Completion tracking
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by TEXT,
    completion_notes TEXT,
    
    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own schedule events" 
ON public.schedule_events
FOR SELECT
USING (user_id = auth.uid());

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

-- Create trigger for updated_at
CREATE TRIGGER update_schedule_events_updated_at
BEFORE UPDATE ON public.schedule_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_schedule_events_user_id ON public.schedule_events(user_id);
CREATE INDEX idx_schedule_events_start_date ON public.schedule_events(start_date);
CREATE INDEX idx_schedule_events_event_type ON public.schedule_events(event_type);
CREATE INDEX idx_schedule_events_status ON public.schedule_events(status);
CREATE INDEX idx_schedule_events_rabbit_id ON public.schedule_events(rabbit_id);
CREATE INDEX idx_schedule_events_is_recurring ON public.schedule_events(is_recurring);
CREATE INDEX idx_schedule_events_priority ON public.schedule_events(priority);

-- Composite indexes for common queries
CREATE INDEX idx_schedule_events_user_date ON public.schedule_events(user_id, start_date);
CREATE INDEX idx_schedule_events_date_range ON public.schedule_events(start_date, end_date);
CREATE INDEX idx_schedule_events_type_date ON public.schedule_events(event_type, start_date);
CREATE INDEX idx_schedule_events_status_date ON public.schedule_events(status, start_date);

-- Create view for events with rabbit information
CREATE OR REPLACE VIEW public.schedule_events_with_rabbit AS
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
WHERE se.is_deleted = false;

-- Add helpful functions
CREATE OR REPLACE FUNCTION public.get_events_for_date_range(
    start_date_param DATE,
    end_date_param DATE,
    user_id_param UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    event_type TEXT,
    start_date DATE,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    all_day BOOLEAN,
    priority TEXT,
    status TEXT,
    rabbit_tag TEXT,
    rabbit_name TEXT,
    is_overdue BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        sew.id,
        sew.title,
        sew.description,
        sew.event_type,
        sew.start_date,
        sew.start_time,
        sew.end_date,
        sew.end_time,
        sew.all_day,
        sew.priority,
        sew.status,
        sew.rabbit_tag,
        sew.rabbit_name,
        sew.is_overdue
    FROM public.schedule_events_with_rabbit sew
    WHERE sew.user_id = user_id_param
    AND sew.start_date >= start_date_param 
    AND sew.start_date <= end_date_param
    ORDER BY sew.start_date, sew.start_time;
$$;

CREATE OR REPLACE FUNCTION public.get_upcoming_events(
    days_ahead INTEGER DEFAULT 7,
    limit_count INTEGER DEFAULT 10,
    user_id_param UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    event_type TEXT,
    start_date DATE,
    start_time TIME,
    priority TEXT,
    status TEXT,
    rabbit_tag TEXT,
    rabbit_name TEXT,
    days_until INTEGER,
    is_overdue BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        sew.id,
        sew.title,
        sew.description,
        sew.event_type,
        sew.start_date,
        sew.start_time,
        sew.priority,
        sew.status,
        sew.rabbit_tag,
        sew.rabbit_name,
        sew.days_until,
        sew.is_overdue
    FROM public.schedule_events_with_rabbit sew
    WHERE sew.user_id = user_id_param
    AND sew.start_date >= CURRENT_DATE
    AND sew.start_date <= (CURRENT_DATE + (days_ahead || ' days')::INTERVAL)
    AND sew.status IN ('scheduled', 'in_progress')
    ORDER BY sew.start_date, sew.start_time
    LIMIT limit_count;
$$;

-- Add comments
COMMENT ON TABLE public.schedule_events IS 'Scheduled farm activities and events';
COMMENT ON COLUMN public.schedule_events.event_type IS 'Type of farm activity: breeding, feeding, health, maintenance, general';
COMMENT ON COLUMN public.schedule_events.recurrence_days IS 'Array of weekday names for weekly recurring events';
COMMENT ON COLUMN public.schedule_events.related_record_id IS 'UUID linking to related records (health_records, breeding plans, etc.)';
COMMENT ON COLUMN public.schedule_events.location IS 'Farm location, cage section, or area where event takes place';
