-- Enable SUPER_ADMIN to view all users and rabbits for Breeder Management
-- This migration adds policies that allow SUPER_ADMIN to bypass organization restrictions

-- First, create a helper function that checks if the current user is a SUPER_ADMIN
-- This function uses SECURITY DEFINER to bypass RLS and avoid infinite recursion
-- The function owner (usually postgres) has full access, so RLS is bypassed
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    is_admin BOOLEAN := false;
BEGIN
    current_user_id := auth.uid();
    
    -- If no user is authenticated, return false
    IF current_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Directly check if the user's role name is SUPER_ADMIN
    -- Join auth.users -> profiles -> roles
    -- profiles.user_id references auth.users(id)
    SELECT EXISTS (
        SELECT 1 
        FROM auth.users au
        INNER JOIN public.profiles p ON p.user_id = au.id  -- profiles.user_id = auth.users.id
        INNER JOIN public.roles r ON r.id = p.role_id
        WHERE au.id = current_user_id 
        AND r.name = 'SUPER_ADMIN'
    ) INTO is_admin;
    
    RETURN COALESCE(is_admin, false);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- 1. Allow SUPER_ADMIN to view all profiles (for Breeder Management)
-- Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "SUPER_ADMIN can view all profiles" ON public.profiles;

CREATE POLICY "SUPER_ADMIN can view all profiles" 
ON public.profiles
FOR SELECT
USING (is_super_admin());

-- 2. Allow SUPER_ADMIN to view all rabbits (for counting user rabbits)
-- Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "SUPER_ADMIN can view all rabbits" ON public.rabbits;

CREATE POLICY "SUPER_ADMIN can view all rabbits" 
ON public.rabbits
FOR SELECT
USING (
    (is_deleted IS NULL OR is_deleted = false)
    AND is_super_admin()
);

-- 3. Optional: Create a function to get user emails and verification status (for displaying in Breeder Management)
-- This function allows SUPER_ADMIN to retrieve emails from auth.users
CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is a SUPER_ADMIN using the helper function
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can access this function';
    END IF;

    -- Return user IDs, emails, and verification status from auth.users
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.email_confirmed_at,
        au.last_sign_in_at
    FROM auth.users au
    INNER JOIN public.profiles p ON p.user_id = au.id  -- profiles.user_id = auth.users.id
    WHERE au.email IS NOT NULL;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_users_with_emails() IS 'Returns user IDs and emails for SUPER_ADMIN in Breeder Management view';

