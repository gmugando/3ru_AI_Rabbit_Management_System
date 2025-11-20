-- Test function to verify SUPER_ADMIN access is working
-- This helps debug if the is_super_admin() function is working correctly

-- Create a simple test function that returns the current user's role info
CREATE OR REPLACE FUNCTION test_current_user_role()
RETURNS TABLE (
    user_id UUID,
    is_super_admin BOOLEAN,
    role_name TEXT,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    user_is_super_admin BOOLEAN;
    user_role_name TEXT;
    user_email TEXT;
    profile_exists BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    user_is_super_admin := is_super_admin();
    
    -- Check if profile exists for this user
    SELECT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = current_user_id) INTO profile_exists;
    
    -- Get role name by joining auth.users -> profiles -> roles
    -- profiles.user_id references auth.users(id)
    SELECT r.name INTO user_role_name
    FROM auth.users au
    INNER JOIN profiles p ON p.user_id = au.id  -- profiles.user_id = auth.users.id
    INNER JOIN roles r ON r.id = p.role_id
    WHERE au.id = current_user_id;
    
    -- If still null, provide diagnostic info
    IF user_role_name IS NULL THEN
        IF NOT profile_exists THEN
            user_role_name := 'Profile not found - need to create profile';
        ELSIF EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = current_user_id AND p.role_id IS NULL) THEN
            user_role_name := 'Profile exists but role_id is NULL';
        ELSE
            user_role_name := 'Profile exists but role not found';
        END IF;
    END IF;
    
    -- Try to get email (this might fail if we don't have access)
    BEGIN
        SELECT au.email INTO user_email
        FROM auth.users au
        WHERE au.id = current_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            user_email := 'Cannot access email';
    END;
    
    -- Return the results using VALUES to avoid any column ambiguity
    RETURN QUERY 
    SELECT * FROM (VALUES (
        current_user_id::UUID,
        COALESCE(user_is_super_admin, false)::BOOLEAN,
        COALESCE(user_role_name, 'Unknown')::TEXT,
        COALESCE(user_email, 'N/A')::TEXT
    )) AS t(user_id, is_super_admin, role_name, email);
END;
$$;

GRANT EXECUTE ON FUNCTION test_current_user_role() TO authenticated;

