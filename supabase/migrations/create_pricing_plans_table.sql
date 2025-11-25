-- Create pricing_plans table
-- NOTE: This migration requires the is_super_admin() function to exist
-- Run enable_super_admin_breeder_management.sql first if not already done

CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Plan details
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL,
    currency TEXT,
    period TEXT,
    rabbits INTEGER NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    
    -- Plan flags
    is_popular BOOLEAN DEFAULT false,
    is_custom BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Button configuration
    button_text TEXT NOT NULL,
    button_link TEXT NOT NULL,
    button_class TEXT DEFAULT 'btn-primary',
    
    -- Display order
    display_order INTEGER DEFAULT 0
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to view active pricing plans (public)
CREATE POLICY "Anyone can view active pricing plans" 
ON public.pricing_plans
FOR SELECT
USING (is_active = true);

-- Policy for super admins to insert pricing plans
CREATE POLICY "Super admins can insert pricing plans" 
ON public.pricing_plans
FOR INSERT
WITH CHECK (is_super_admin());

-- Policy for super admins to update pricing plans
CREATE POLICY "Super admins can update pricing plans" 
ON public.pricing_plans
FOR UPDATE
USING (is_super_admin());

-- Policy for super admins to delete pricing plans
CREATE POLICY "Super admins can delete pricing plans" 
ON public.pricing_plans
FOR DELETE
USING (is_super_admin());

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pricing_plans_updated_at
BEFORE UPDATE ON public.pricing_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_pricing_plans_is_active ON public.pricing_plans(is_active);
CREATE INDEX idx_pricing_plans_display_order ON public.pricing_plans(display_order);

-- Add comment to the table
COMMENT ON TABLE public.pricing_plans IS 'Pricing plans for the rabbit management system';

