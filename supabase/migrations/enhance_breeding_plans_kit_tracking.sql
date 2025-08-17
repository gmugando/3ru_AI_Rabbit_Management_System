-- Enhance breeding_plans table with additional kit tracking fields
ALTER TABLE public.breeding_plans 
ADD COLUMN IF NOT EXISTS actual_kindle_date DATE,
ADD COLUMN IF NOT EXISTS kits_born INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kits_male INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kits_female INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kits_survived INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_birth_weight DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS kit_color TEXT,
ADD COLUMN IF NOT EXISTS kindling_notes TEXT,
ADD COLUMN IF NOT EXISTS survival_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weaning_date DATE,
ADD COLUMN IF NOT EXISTS weaning_count INTEGER DEFAULT 0;

-- Create kit_records table for individual kit tracking
CREATE TABLE IF NOT EXISTS public.kit_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Kit identification
    breeding_plan_id UUID NOT NULL REFERENCES public.breeding_plans(id) ON DELETE CASCADE,
    kit_id TEXT UNIQUE NOT NULL,
    
    -- Basic information
    birth_date DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    color TEXT,
    weight_at_birth DECIMAL(4,2),
    
    -- Status tracking
    status TEXT DEFAULT 'alive' CHECK (status IN ('alive', 'deceased', 'sold', 'kept_for_breeding')),
    cause_of_death TEXT,
    death_date DATE,
    
    -- Development tracking
    weaning_date DATE,
    weaning_weight DECIMAL(4,2),
    
    -- Additional information
    notes TEXT,
    
    -- User association
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create kit_health_records table for health monitoring
CREATE TABLE IF NOT EXISTS public.kit_health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Kit reference
    kit_id UUID NOT NULL REFERENCES public.kit_records(id) ON DELETE CASCADE,
    
    -- Health check details
    check_date DATE NOT NULL,
    weight DECIMAL(4,2),
    health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'under_observation', 'sick', 'recovered')),
    
    -- Health information
    issues TEXT,
    treatments TEXT,
    notes TEXT,
    
    -- User association
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies for kit_records
ALTER TABLE public.kit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own kit records" 
ON public.kit_records
FOR SELECT
USING (created_by = auth.uid());

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

-- Add RLS policies for kit_health_records
ALTER TABLE public.kit_health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own kit health records" 
ON public.kit_health_records
FOR SELECT
USING (created_by = auth.uid());

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

-- Create triggers for updated_at
CREATE TRIGGER update_kit_records_updated_at
BEFORE UPDATE ON public.kit_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kit_health_records_updated_at
BEFORE UPDATE ON public.kit_health_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_kit_records_breeding_plan_id ON public.kit_records(breeding_plan_id);
CREATE INDEX idx_kit_records_kit_id ON public.kit_records(kit_id);
CREATE INDEX idx_kit_records_status ON public.kit_records(status);
CREATE INDEX idx_kit_records_birth_date ON public.kit_records(birth_date);
CREATE INDEX idx_kit_records_created_by ON public.kit_records(created_by);

CREATE INDEX idx_kit_health_records_kit_id ON public.kit_health_records(kit_id);
CREATE INDEX idx_kit_health_records_check_date ON public.kit_health_records(check_date);
CREATE INDEX idx_kit_health_records_health_status ON public.kit_health_records(health_status);
CREATE INDEX idx_kit_health_records_created_by ON public.kit_health_records(created_by);

-- Add comments
COMMENT ON TABLE public.kit_records IS 'Individual kit records for tracking each kit from birth';
COMMENT ON TABLE public.kit_health_records IS 'Health records for individual kits';

-- Create function to automatically calculate survival rate
CREATE OR REPLACE FUNCTION calculate_survival_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.kits_born > 0 THEN
        NEW.survival_rate = ROUND((NEW.kits_survived::DECIMAL / NEW.kits_born::DECIMAL) * 100, 2);
    ELSE
        NEW.survival_rate = 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate survival rate
CREATE TRIGGER trigger_calculate_survival_rate
BEFORE UPDATE ON public.breeding_plans
FOR EACH ROW
EXECUTE FUNCTION calculate_survival_rate();

-- Create function to generate unique kit IDs
CREATE OR REPLACE FUNCTION generate_kit_id()
RETURNS TEXT AS $$
DECLARE
    new_kit_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_kit_id := 'KIT-' || LPAD(counter::TEXT, 3, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.kit_records WHERE kit_id = new_kit_id) THEN
            RETURN new_kit_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
