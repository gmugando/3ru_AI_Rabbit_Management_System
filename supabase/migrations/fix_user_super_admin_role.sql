-- Fix: Set user as SUPER_ADMIN
-- Replace 'bfce9fb4-8a2a-40de-a65a-dd5c733b5ce6' with your actual user ID

-- First, verify the user exists and current role
SELECT 
    au.id as auth_user_id,
    au.email,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.first_name,
    p.last_name,
    p.role_id as current_role_id,
    r.name as current_role_name
FROM auth.users au
LEFT JOIN profiles p ON p.user_id = au.id  -- profiles.user_id = auth.users.id
LEFT JOIN roles r ON r.id = p.role_id
WHERE au.id = 'bfce9fb4-8a2a-40de-a65a-dd5c733b5ce6';

-- Get the SUPER_ADMIN role ID
SELECT id, name FROM roles WHERE name = 'SUPER_ADMIN';

-- Update the user to be SUPER_ADMIN
-- IMPORTANT: Replace 'bfce9fb4-8a2a-40de-a65a-dd5c733b5ce6' with your actual user ID
UPDATE profiles 
SET role_id = (SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1)
WHERE user_id = 'bfce9fb4-8a2a-40de-a65a-dd5c733b5ce6';

-- Verify the update
SELECT 
    au.id as auth_user_id,
    au.email,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    r.name as role_name,
    r.id as role_id
FROM auth.users au
INNER JOIN profiles p ON p.user_id = au.id  -- profiles.user_id = auth.users.id
JOIN roles r ON r.id = p.role_id
WHERE au.id = 'bfce9fb4-8a2a-40de-a65a-dd5c733b5ce6';

