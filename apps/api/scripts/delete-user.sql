-- Delete user with email: jutobar06@gmail.com
-- Run this from Supabase Dashboard > SQL Editor

-- First, find the user
SELECT id, email, name, role, company_id 
FROM users 
WHERE email = 'jutobar06@gmail.com';

-- Delete the user (this will fail if there are related records)
DELETE FROM users 
WHERE email = 'jutobar06@gmail.com';

-- If you get a foreign key error, you may need to delete related records first:
-- DELETE FROM companies WHERE id IN (SELECT company_id FROM users WHERE email = 'jutobar06@gmail.com');
-- DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = 'jutobar06@gmail.com');
-- DELETE FROM audit_logs WHERE user_id = (SELECT id FROM users WHERE email = 'jutobar06@gmail.com');
-- Then try the delete again