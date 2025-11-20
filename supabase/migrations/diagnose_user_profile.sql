-- Diagnostic query to check user profile and role
-- This shows the relationship between auth.users, profiles, and roles

-- Get current authenticated user from auth.users
-- Then check if profile exists and what role they have
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.role_id,
    r.id as role_table_id,
    r.name as role_name,
    CASE 
        WHEN p.id IS NULL THEN 'Profile does not exist'
        WHEN p.role_id IS NULL THEN 'Profile exists but role_id is NULL'
        WHEN r.id IS NULL THEN 'Profile has role_id but role does not exist'
        ELSE 'Profile and role OK'
    END as status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN roles r ON r.id = p.role_id
WHERE au.id = auth.uid();  -- This gets the current authenticated user

-- Alternative: If you want to check a specific user ID
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID
/*
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.role_id,
    r.name as role_name
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN roles r ON r.id = p.role_id
WHERE au.id = 'YOUR_USER_ID_HERE';
*/

-- If profile doesn't exist, you'll need to create it
-- If profile exists but role_id is wrong, update it:
/*
UPDATE profiles 
SET role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1)
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
*/

