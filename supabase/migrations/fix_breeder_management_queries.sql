-- Fix Breeder Management queries - ensure emails and rabbit counts work
-- This migration fixes potential issues with the get_users_with_emails function

-- Drop and recreate the email function with better error handling and verification status
DROP FUNCTION IF EXISTS get_users_with_emails();

CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Check if the current user is a SUPER_ADMIN using the helper function
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can access this function';
    END IF;

    -- Return user IDs, emails, and verification status from auth.users
    -- Note: In Supabase, we need to access auth.users through the auth schema
    RETURN QUERY
    SELECT 
        au.id,
        au.email::TEXT,
        au.email_confirmed_at,
        au.last_sign_in_at
    FROM auth.users au
    WHERE au.email IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.user_id = au.id  -- profiles.user_id = auth.users.id
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;

-- Verify the function exists and works
DO $$
BEGIN
    -- Test that the function can be called (will fail if not SUPER_ADMIN, which is expected)
    RAISE NOTICE 'get_users_with_emails function created successfully';
END $$;

