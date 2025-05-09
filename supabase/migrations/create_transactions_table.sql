-- Create transactions table with user association
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Transaction details
    type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    
    -- User association
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions
FOR SELECT
USING (user_id = auth.uid());

-- Policy for users to insert their own transactions
CREATE POLICY "Users can insert their own transactions" 
ON public.transactions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own transactions
CREATE POLICY "Users can update their own transactions" 
ON public.transactions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy for users to delete their own transactions (soft delete)
CREATE POLICY "Users can delete their own transactions" 
ON public.transactions
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
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_category ON public.transactions(category);

-- Add comment to the table
COMMENT ON TABLE public.transactions IS 'Financial transactions for each user'; 