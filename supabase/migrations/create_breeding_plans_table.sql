-- Create breeding_plans table
CREATE TABLE IF NOT EXISTS public.breeding_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Breeding plan details
    plan_id TEXT UNIQUE NOT NULL,
    buck_id UUID REFERENCES public.rabbits(id) ON DELETE CASCADE,
    doe_id UUID REFERENCES public.rabbits(id) ON DELETE CASCADE,
    planned_date DATE NOT NULL,
    actual_mating_date DATE,
    expected_kindle_date DATE,
    actual_kindle_date DATE,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    kits_born INTEGER DEFAULT 0,
    kits_survived INTEGER DEFAULT 0,
    notes TEXT,
    
    -- User association
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.breeding_plans ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own breeding plans
CREATE POLICY "Users can view their own breeding plans" 
ON public.breeding_plans
FOR SELECT
USING (created_by = auth.uid());

-- Policy for users to insert their own breeding plans
CREATE POLICY "Users can insert their own breeding plans" 
ON public.breeding_plans
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Policy for users to update their own breeding plans
CREATE POLICY "Users can update their own breeding plans" 
ON public.breeding_plans
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy for users to delete their own breeding plans (soft delete)
CREATE POLICY "Users can delete their own breeding plans" 
ON public.breeding_plans
FOR DELETE
USING (created_by = auth.uid());

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_breeding_plans_updated_at
BEFORE UPDATE ON public.breeding_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_breeding_plans_created_by ON public.breeding_plans(created_by);
CREATE INDEX idx_breeding_plans_status ON public.breeding_plans(status);
CREATE INDEX idx_breeding_plans_buck_id ON public.breeding_plans(buck_id);
CREATE INDEX idx_breeding_plans_doe_id ON public.breeding_plans(doe_id);
CREATE INDEX idx_breeding_plans_planned_date ON public.breeding_plans(planned_date);
CREATE INDEX idx_breeding_plans_expected_kindle_date ON public.breeding_plans(expected_kindle_date);
CREATE INDEX idx_breeding_plans_plan_id ON public.breeding_plans(plan_id);

-- Add comment to the table
COMMENT ON TABLE public.breeding_plans IS 'Breeding plans for rabbits';
