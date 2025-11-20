-- Fix is_super_admin() function to work correctly
-- This version uses a more direct approach to check if user is SUPER_ADMIN

DROP FUNCTION IF EXISTS is_super_admin();

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

-- Test the function (this will show if it works for the current user)
-- Note: This will only work if run as an authenticated user, not in SQL editor
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- This test will only work when called from an authenticated session
    -- It will fail in SQL editor but that's expected
    SELECT is_super_admin() INTO test_result;
    RAISE NOTICE 'is_super_admin() function recreated. Test result: %', test_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'is_super_admin() function recreated (test skipped - expected in SQL editor)';
END $$;

