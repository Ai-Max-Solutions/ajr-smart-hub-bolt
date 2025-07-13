-- Add some demo users with Supabase auth IDs for testing
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    raw_user_meta_data
) VALUES 
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    'admin@ajryan.co.uk',
    '$2a$10$example.encrypted.password.hash.here',
    now(),
    now(),
    now(),
    '',
    '{"first_name": "Admin", "last_name": "User", "full_name": "Admin User"}'::jsonb
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d480'::uuid, 
    'john.smith@ajryan.co.uk',
    '$2a$10$example.encrypted.password.hash.here',
    now(),
    now(),
    now(),
    '',
    '{"first_name": "John", "last_name": "Smith", "full_name": "John Smith"}'::jsonb
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d481'::uuid,
    'sarah.jones@ajryan.co.uk', 
    '$2a$10$example.encrypted.password.hash.here',
    now(),
    now(),
    now(),
    '',
    '{"first_name": "Sarah", "last_name": "Jones", "full_name": "Sarah Jones"}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- Update existing Users table to link with Supabase auth
UPDATE public."Users" 
SET supabase_auth_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid
WHERE email = 'admin@ajryan.co.uk';

UPDATE public."Users"
SET supabase_auth_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d480'::uuid 
WHERE email = 'john.smith@ajryan.co.uk';

UPDATE public."Users"
SET supabase_auth_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d481'::uuid
WHERE email = 'sarah.jones@ajryan.co.uk';

-- Create a demo admin user that matches your existing data
INSERT INTO public."Users" (
    whalesync_postgres_id,
    supabase_auth_id,
    email,
    firstname,
    lastname,
    fullname,
    role,
    employmentstatus,
    auth_provider,
    system_role
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
    'admin@ajryan.co.uk',
    'Admin',
    'User', 
    'Admin User',
    'Admin',
    'Active',
    'supabase',
    'Admin'
) ON CONFLICT (email) DO UPDATE SET
    supabase_auth_id = EXCLUDED.supabase_auth_id,
    system_role = EXCLUDED.system_role;