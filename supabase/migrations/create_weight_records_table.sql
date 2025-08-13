-- Create weight_records table
CREATE TABLE IF NOT EXISTS public.weight_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Weight record details
    rabbit_id UUID NOT NULL REFERENCES public.rabbits(id) ON DELETE CASCADE,
    weight DECIMAL(5, 2) NOT NULL CHECK (weight > 0 AND weight <= 20), -- Weight in kg (0.01 - 20.00)
    measurement_date DATE NOT NULL,
    body_condition_score INTEGER CHECK (body_condition_score >= 1 AND body_condition_score <= 5), -- BCS 1-5 scale
    measurement_type TEXT NOT NULL DEFAULT 'routine' CHECK (measurement_type IN ('routine', 'health', 'breeding', 'growth')),
    measured_by TEXT, -- Who took the measurement
    notes TEXT, -- Additional observations
    
    -- Environmental factors (optional)
    temperature DECIMAL(4, 1), -- Temperature during measurement in Celsius
    time_of_day TIME, -- Time when measurement was taken
    
    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own weight records
CREATE POLICY "Users can view their own weight records" 
ON public.weight_records
FOR SELECT
USING (user_id = auth.uid());

-- Policy for users to insert their own weight records
CREATE POLICY "Users can insert their own weight records" 
ON public.weight_records
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own weight records
CREATE POLICY "Users can update their own weight records" 
ON public.weight_records
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for users to delete their own weight records (soft delete)
CREATE POLICY "Users can delete their own weight records" 
ON public.weight_records
FOR DELETE
USING (user_id = auth.uid());

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_weight_records_updated_at
BEFORE UPDATE ON public.weight_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_weight_records_user_id ON public.weight_records(user_id);
CREATE INDEX idx_weight_records_rabbit_id ON public.weight_records(rabbit_id);
CREATE INDEX idx_weight_records_measurement_date ON public.weight_records(measurement_date);
CREATE INDEX idx_weight_records_measurement_type ON public.weight_records(measurement_type);
CREATE INDEX idx_weight_records_created_at ON public.weight_records(created_at);

-- Composite index for common queries
CREATE INDEX idx_weight_records_rabbit_date ON public.weight_records(rabbit_id, measurement_date DESC);
CREATE INDEX idx_weight_records_user_date ON public.weight_records(user_id, measurement_date DESC);

-- Add comment to the table
COMMENT ON TABLE public.weight_records IS 'Weight tracking records for rabbits with body condition scoring and measurement metadata';

-- Add column comments for better documentation
COMMENT ON COLUMN public.weight_records.weight IS 'Weight in kilograms (0.01 - 20.00 kg)';
COMMENT ON COLUMN public.weight_records.body_condition_score IS 'Body condition score on 1-5 scale (1=very thin, 3=ideal, 5=obese)';
COMMENT ON COLUMN public.weight_records.measurement_type IS 'Type of measurement: routine, health, breeding, or growth tracking';
COMMENT ON COLUMN public.weight_records.measured_by IS 'Name of person who took the measurement';
COMMENT ON COLUMN public.weight_records.temperature IS 'Environmental temperature during measurement in Celsius';
COMMENT ON COLUMN public.weight_records.time_of_day IS 'Time when measurement was taken';

-- Create a view for weight records with rabbit information
CREATE OR REPLACE VIEW public.weight_records_with_rabbit AS
SELECT 
    wr.id,
    wr.created_at,
    wr.updated_at,
    wr.weight,
    wr.measurement_date,
    wr.body_condition_score,
    wr.measurement_type,
    wr.measured_by,
    wr.notes,
    wr.temperature,
    wr.time_of_day,
    wr.user_id,
    r.rabbit_id as rabbit_tag,
    r.name as rabbit_name,
    r.breed,
    r.gender,
    r.date_of_birth,
    -- Calculate age at measurement
    (wr.measurement_date - r.date_of_birth) as age_in_days,
    -- Calculate weight change from previous record
    LAG(wr.weight) OVER (PARTITION BY wr.rabbit_id ORDER BY wr.measurement_date) as previous_weight,
    wr.weight - LAG(wr.weight) OVER (PARTITION BY wr.rabbit_id ORDER BY wr.measurement_date) as weight_change
FROM public.weight_records wr
JOIN public.rabbits r ON wr.rabbit_id = r.id
WHERE wr.is_deleted = false
ORDER BY wr.measurement_date DESC;

-- Add RLS to the view
ALTER VIEW public.weight_records_with_rabbit SET (security_invoker = true);

-- Create a function to get weight trends for a rabbit
CREATE OR REPLACE FUNCTION public.get_rabbit_weight_trend(
    rabbit_uuid UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    measurement_date DATE,
    weight DECIMAL(5,2),
    weight_change DECIMAL(5,2),
    body_condition_score INTEGER,
    measurement_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wr.measurement_date,
        wr.weight,
        wr.weight - LAG(wr.weight) OVER (ORDER BY wr.measurement_date) as weight_change,
        wr.body_condition_score,
        wr.measurement_type
    FROM public.weight_records wr
    WHERE wr.rabbit_id = rabbit_uuid 
        AND wr.measurement_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
        AND wr.is_deleted = false
        AND wr.user_id = auth.uid()
    ORDER BY wr.measurement_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get weight statistics for a rabbit
CREATE OR REPLACE FUNCTION public.get_rabbit_weight_stats(rabbit_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'current_weight', (
            SELECT weight 
            FROM public.weight_records 
            WHERE rabbit_id = rabbit_uuid 
                AND is_deleted = false 
                AND user_id = auth.uid()
            ORDER BY measurement_date DESC 
            LIMIT 1
        ),
        'average_weight', (
            SELECT ROUND(AVG(weight), 2) 
            FROM public.weight_records 
            WHERE rabbit_id = rabbit_uuid 
                AND is_deleted = false 
                AND user_id = auth.uid()
        ),
        'min_weight', (
            SELECT MIN(weight) 
            FROM public.weight_records 
            WHERE rabbit_id = rabbit_uuid 
                AND is_deleted = false 
                AND user_id = auth.uid()
        ),
        'max_weight', (
            SELECT MAX(weight) 
            FROM public.weight_records 
            WHERE rabbit_id = rabbit_uuid 
                AND is_deleted = false 
                AND user_id = auth.uid()
        ),
        'total_records', (
            SELECT COUNT(*) 
            FROM public.weight_records 
            WHERE rabbit_id = rabbit_uuid 
                AND is_deleted = false 
                AND user_id = auth.uid()
        ),
        'last_measurement_date', (
            SELECT measurement_date 
            FROM public.weight_records 
            WHERE rabbit_id = rabbit_uuid 
                AND is_deleted = false 
                AND user_id = auth.uid()
            ORDER BY measurement_date DESC 
            LIMIT 1
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
