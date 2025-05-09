-- Create feeding schedules table
CREATE TABLE IF NOT EXISTS public.feeding_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    time TIME NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    feed_type TEXT NOT NULL CHECK (feed_type IN ('adult_rabbit_feed', 'growing_rabbit_feed', 'breeding_rabbit_feed', 'hay', 'supplements')),
    sections TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Add table comment
COMMENT ON TABLE public.feeding_schedules IS 'Stores feeding schedules for rabbits, associated with users';

-- Enable Row Level Security
ALTER TABLE public.feeding_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own feeding schedules"
    ON public.feeding_schedules
    FOR SELECT
    USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert their own feeding schedules"
    ON public.feeding_schedules
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feeding schedules"
    ON public.feeding_schedules
    FOR UPDATE
    USING (auth.uid() = user_id AND is_deleted = false)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feeding schedules"
    ON public.feeding_schedules
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX feeding_schedules_user_id_idx ON public.feeding_schedules(user_id);
CREATE INDEX feeding_schedules_time_idx ON public.feeding_schedules(time);
CREATE INDEX feeding_schedules_frequency_idx ON public.feeding_schedules(frequency);
CREATE INDEX feeding_schedules_feed_type_idx ON public.feeding_schedules(feed_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.feeding_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 