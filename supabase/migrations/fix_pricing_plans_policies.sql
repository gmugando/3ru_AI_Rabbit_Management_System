-- Fix pricing_plans RLS policies to use is_super_admin() function
-- This fixes the "permission denied for table users" error

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can insert pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Super admins can update pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Super admins can delete pricing plans" ON public.pricing_plans;

-- Recreate policies using the is_super_admin() helper function
-- Note: The is_super_admin() function must exist (created by enable_super_admin_breeder_management.sql)

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

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'pricing_plans';

