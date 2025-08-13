-- Create health_records table
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Basic record information
    rabbit_id UUID NOT NULL REFERENCES public.rabbits(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('checkup', 'illness', 'treatment', 'vaccination', 'injury', 'observation')),
    status TEXT NOT NULL CHECK (status IN ('healthy', 'under_treatment', 'under_observation', 'recovered', 'chronic')),
    
    -- Condition details
    condition TEXT, -- Main condition or diagnosis
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    affected_area TEXT CHECK (affected_area IN ('respiratory', 'digestive', 'skin', 'eyes', 'ears', 'limbs', 'reproductive', 'neurological', 'general')),
    symptoms TEXT, -- Detailed symptoms description
    
    -- Treatment information
    treatment_type TEXT CHECK (treatment_type IN ('medication', 'surgery', 'therapy', 'isolation', 'dietary', 'environmental', 'monitoring')),
    medication TEXT, -- Medication name or treatment details
    dosage TEXT, -- Dosage information
    frequency TEXT CHECK (frequency IN ('once_daily', 'twice_daily', 'three_times_daily', 'every_other_day', 'weekly', 'as_needed', 'single_dose')),
    treatment_start_date DATE,
    treatment_duration INTEGER, -- Duration in days
    treatment_end_date DATE GENERATED ALWAYS AS (treatment_start_date + INTERVAL '1 day' * COALESCE(treatment_duration, 0)) STORED,
    
    -- Additional information
    veterinarian TEXT, -- Veterinarian name
    cost DECIMAL(8, 2) CHECK (cost >= 0), -- Treatment cost
    notes TEXT, -- Additional notes and observations
    
    -- Follow-up information
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_completed BOOLEAN DEFAULT false,
    
    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own health records
CREATE POLICY "Users can view their own health records" 
ON public.health_records
FOR SELECT
USING (user_id = auth.uid());

-- Policy for users to insert their own health records
CREATE POLICY "Users can insert their own health records" 
ON public.health_records
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own health records
CREATE POLICY "Users can update their own health records" 
ON public.health_records
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for users to delete their own health records (soft delete)
CREATE POLICY "Users can delete their own health records" 
ON public.health_records
FOR DELETE
USING (user_id = auth.uid());

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_health_records_updated_at
BEFORE UPDATE ON public.health_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_health_records_user_id ON public.health_records(user_id);
CREATE INDEX idx_health_records_rabbit_id ON public.health_records(rabbit_id);
CREATE INDEX idx_health_records_record_date ON public.health_records(record_date);
CREATE INDEX idx_health_records_record_type ON public.health_records(record_type);
CREATE INDEX idx_health_records_status ON public.health_records(status);
CREATE INDEX idx_health_records_created_at ON public.health_records(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_health_records_rabbit_date ON public.health_records(rabbit_id, record_date DESC);
CREATE INDEX idx_health_records_user_date ON public.health_records(user_id, record_date DESC);
CREATE INDEX idx_health_records_status_date ON public.health_records(status, record_date DESC);
CREATE INDEX idx_health_records_follow_up ON public.health_records(follow_up_required, follow_up_date) WHERE follow_up_required = true;

-- Add comment to the table
COMMENT ON TABLE public.health_records IS 'Health records for rabbits including conditions, treatments, and medical history';

-- Add column comments for better documentation
COMMENT ON COLUMN public.health_records.record_type IS 'Type of health record: checkup, illness, treatment, vaccination, injury, observation';
COMMENT ON COLUMN public.health_records.status IS 'Current health status: healthy, under_treatment, under_observation, recovered, chronic';
COMMENT ON COLUMN public.health_records.severity IS 'Severity level of the condition: mild, moderate, severe, critical';
COMMENT ON COLUMN public.health_records.affected_area IS 'Body system or area affected by the condition';
COMMENT ON COLUMN public.health_records.treatment_duration IS 'Treatment duration in days';
COMMENT ON COLUMN public.health_records.treatment_end_date IS 'Calculated end date based on start date and duration';
COMMENT ON COLUMN public.health_records.cost IS 'Treatment cost in currency units';
COMMENT ON COLUMN public.health_records.follow_up_required IS 'Whether follow-up is required for this record';

-- Create a view for health records with rabbit information
CREATE OR REPLACE VIEW public.health_records_with_rabbit AS
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
ORDER BY hr.record_date DESC;

-- Add RLS to the view
ALTER VIEW public.health_records_with_rabbit SET (security_invoker = true);

-- Create a function to get health summary for a rabbit
CREATE OR REPLACE FUNCTION public.get_rabbit_health_summary(rabbit_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_records', (
            SELECT COUNT(*) 
            FROM public.health_records 
            WHERE rabbit_id = rabbit_uuid 
                AND is_deleted = false 
                AND user_id = auth.uid()
        ),
        'current_status', (
            SELECT status 
            FROM public.health_records 
            WHERE rabbit_id = rabbit_uuid 
                AND is_deleted = false 
                AND user_id = auth.uid()
            ORDER BY record_date DESC 
            LIMIT 1
        ),
        'active_treatments', (
            SELECT COUNT(*) 
            FROM public.health_records 
            WHERE rabbit_id = rabbit_uuid 
                AND status = 'under_treatment'
                AND is_deleted = false 
                AND user_id = auth.uid()
                AND (treatment_end_date IS NULL OR treatment_end_date >= CURRENT_DATE)
        ),
        'pending_followups', (
            SELECT COUNT(*) 
            FROM public.health_records 
            WHERE rabbit_id = rabbit_uuid 
                AND follow_up_required = true
                AND follow_up_completed = false
                AND is_deleted = false 
                AND user_id = auth.uid()
        ),
        'last_checkup', (
            SELECT record_date 
            FROM public.health_records 
            WHERE rabbit_id = rabbit_uuid 
                AND record_type = 'checkup'
                AND is_deleted = false 
                AND user_id = auth.uid()
            ORDER BY record_date DESC 
            LIMIT 1
        ),
        'total_cost', (
            SELECT COALESCE(SUM(cost), 0) 
            FROM public.health_records 
            WHERE rabbit_id = rabbit_uuid 
                AND is_deleted = false 
                AND user_id = auth.uid()
                AND cost IS NOT NULL
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get health statistics
CREATE OR REPLACE FUNCTION public.get_health_statistics(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_rabbits INTEGER;
BEGIN
    -- Get total active rabbits for the user
    SELECT COUNT(*) INTO total_rabbits
    FROM public.rabbits 
    WHERE status = 'active' 
        AND is_deleted = false 
        AND created_by = auth.uid();

    SELECT json_build_object(
        'total_rabbits', total_rabbits,
        'healthy_rabbits', (
            SELECT COUNT(DISTINCT rabbit_id)
            FROM public.health_records hr
            WHERE hr.user_id = auth.uid()
                AND hr.is_deleted = false
                AND hr.status = 'healthy'
                AND hr.record_date >= CURRENT_DATE - INTERVAL '%s days' % days_back
        ),
        'under_treatment', (
            SELECT COUNT(DISTINCT rabbit_id)
            FROM public.health_records hr
            WHERE hr.user_id = auth.uid()
                AND hr.is_deleted = false
                AND hr.status = 'under_treatment'
                AND (hr.treatment_end_date IS NULL OR hr.treatment_end_date >= CURRENT_DATE)
        ),
        'under_observation', (
            SELECT COUNT(DISTINCT rabbit_id)
            FROM public.health_records hr
            WHERE hr.user_id = auth.uid()
                AND hr.is_deleted = false
                AND hr.status = 'under_observation'
                AND hr.record_date >= CURRENT_DATE - INTERVAL '%s days' % days_back
        ),
        'pending_followups', (
            SELECT COUNT(*)
            FROM public.health_records hr
            WHERE hr.user_id = auth.uid()
                AND hr.is_deleted = false
                AND hr.follow_up_required = true
                AND hr.follow_up_completed = false
                AND hr.follow_up_date <= CURRENT_DATE + INTERVAL '7 days'
        ),
        'total_treatments', (
            SELECT COUNT(*)
            FROM public.health_records hr
            WHERE hr.user_id = auth.uid()
                AND hr.is_deleted = false
                AND hr.record_type IN ('treatment', 'illness')
                AND hr.record_date >= CURRENT_DATE - INTERVAL '%s days' % days_back
        ),
        'total_cost', (
            SELECT COALESCE(SUM(cost), 0)
            FROM public.health_records hr
            WHERE hr.user_id = auth.uid()
                AND hr.is_deleted = false
                AND hr.cost IS NOT NULL
                AND hr.record_date >= CURRENT_DATE - INTERVAL '%s days' % days_back
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
