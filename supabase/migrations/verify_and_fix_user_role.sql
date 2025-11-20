-- Verify and fix user role assignment
-- This helps identify why is_super_admin() is returning false

-- First, let's check what roles exist
SELECT id, name, description FROM roles ORDER BY id;

-- Check if the user profile exists and what role they have
-- Replace 'bfce9fb4-8a2a-40de-a65a-dd5c733b5ce6' with your actual user ID if different
SELECT 
    au.id as auth_user_id,
    au.email,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.first_name,
    p.last_name,
    p.role_id,
    r.name as role_name,
    r.id as role_table_id
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id  -- profiles.user_id = auth.users.id
LEFT JOIN roles r ON r.id = p.role_id
WHERE au.id = 'bfce9fb4-8a2a-40de-a65a-dd5c733b5ce6';

-- If the user doesn't have SUPER_ADMIN role, update it:
-- Uncomment and run this if needed (replace with your user ID)
/*
UPDATE profiles 
SET role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN')
WHERE user_id = 'bfce9fb4-8a2a-40de-a65a-dd5c733b5ce6';
*/

-- Verify the update worked
SELECT 
    au.id as auth_user_id,
    au.email,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    r.name as role_name
FROM auth.users au
INNER JOIN profiles p ON p.user_id = au.id  -- profiles.user_id = auth.users.id
JOIN roles r ON r.id = p.role_id
WHERE au.id = 'bfce9fb4-8a2a-40de-a65a-dd5c733b5ce6';

-- Test the is_super_admin() function for this user
-- Note: This will only work if you're authenticated as this user
-- In SQL editor, it will show false (expected)
SELECT is_super_admin() as is_admin_check;

