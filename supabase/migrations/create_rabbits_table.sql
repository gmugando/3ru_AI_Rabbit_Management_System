-- Create rabbits table
CREATE TABLE IF NOT EXISTS public.rabbits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Rabbit details
    rabbit_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    date_of_birth DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'deceased')),
    weight DECIMAL(5, 2),
    color TEXT,
    distinguishing_marks TEXT,
    cage_number TEXT,
    diet TEXT,
    notes TEXT,
    image_url TEXT,
    
    -- User association
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.rabbits ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own rabbits
CREATE POLICY "Users can view their own rabbits" 
ON public.rabbits
FOR SELECT
USING (created_by = auth.uid());

-- Policy for users to insert their own rabbits
CREATE POLICY "Users can insert their own rabbits" 
ON public.rabbits
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Policy for users to update their own rabbits
CREATE POLICY "Users can update their own rabbits" 
ON public.rabbits
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy for users to delete their own rabbits (soft delete)
CREATE POLICY "Users can delete their own rabbits" 
ON public.rabbits
FOR DELETE
USING (created_by = auth.uid());

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_rabbits_updated_at
BEFORE UPDATE ON public.rabbits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_rabbits_created_by ON public.rabbits(created_by);
CREATE INDEX idx_rabbits_status ON public.rabbits(status);
CREATE INDEX idx_rabbits_gender ON public.rabbits(gender);
CREATE INDEX idx_rabbits_breed ON public.rabbits(breed);
CREATE INDEX idx_rabbits_rabbit_id ON public.rabbits(rabbit_id);

-- Add comment to the table
COMMENT ON TABLE public.rabbits IS 'Rabbit information for each user';
