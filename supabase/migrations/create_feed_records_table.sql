-- Create feed_records table
CREATE TABLE IF NOT EXISTS public.feed_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Feed record details
    feed_type TEXT NOT NULL CHECK (feed_type IN ('adult_rabbit_feed', 'growing_rabbit_feed', 'breeding_rabbit_feed', 'hay', 'supplements')),
    feed_brand TEXT NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('consumption', 'stock_update')),
    amount DECIMAL(8, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    sections TEXT, -- Optional: which sections were fed
    notes TEXT, -- Optional: additional notes
    
    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.feed_records ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own feed records
CREATE POLICY "Users can view their own feed records" 
ON public.feed_records
FOR SELECT
USING (user_id = auth.uid());

-- Policy for users to insert their own feed records
CREATE POLICY "Users can insert their own feed records" 
ON public.feed_records
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own feed records
CREATE POLICY "Users can update their own feed records" 
ON public.feed_records
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for users to delete their own feed records (soft delete)
CREATE POLICY "Users can delete their own feed records" 
ON public.feed_records
FOR DELETE
USING (user_id = auth.uid());

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_feed_records_updated_at
BEFORE UPDATE ON public.feed_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_feed_records_user_id ON public.feed_records(user_id);
CREATE INDEX idx_feed_records_date ON public.feed_records(date);
CREATE INDEX idx_feed_records_feed_type ON public.feed_records(feed_type);
CREATE INDEX idx_feed_records_record_type ON public.feed_records(record_type);

-- Add comment to the table
COMMENT ON TABLE public.feed_records IS 'Feed consumption and stock update records for each user';