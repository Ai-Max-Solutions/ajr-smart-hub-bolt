-- Phase 1: Add missing foreign key constraint for Users.supabase_auth_id
ALTER TABLE public."Users" 
ADD CONSTRAINT users_supabase_auth_id_fkey 
FOREIGN KEY (supabase_auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Phase 2: Restructure profiles table to follow Supabase standards
-- First, drop existing constraints and dependencies
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_whalesync_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- Add new primary key that references auth.users
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the whalesync_user_id column as it's no longer needed
ALTER TABLE public.profiles DROP COLUMN IF EXISTS whalesync_user_id;

-- Phase 3: Add unique constraints for data integrity
-- Clean up any duplicate emails first
DELETE FROM public."Users" u1 
WHERE u1.whalesync_postgres_id NOT IN (
    SELECT MIN(u2.whalesync_postgres_id) 
    FROM public."Users" u2 
    WHERE u2.email = u1.email AND u2.email IS NOT NULL
);

-- Add unique constraint on email
ALTER TABLE public."Users" ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Phase 4: Create auto-signup trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into profiles table when new user signs up
    INSERT INTO public.profiles (id, system_role, created_at, updated_at)
    VALUES (NEW.id, 'Worker', now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Phase 5: Create unified user view for easier querying
CREATE OR REPLACE VIEW public.user_view AS
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    p.system_role,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at,
    u.whalesync_postgres_id,
    u.firstname,
    u.lastname,
    u.fullname,
    u.role,
    u.employmentstatus,
    u.currentproject,
    u.skills,
    u.phone,
    u.primaryskill,
    u.avatar_url,
    u.performance_rating,
    u.total_plots_completed,
    u.avg_weekly_hours
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public."Users" u ON au.id = u.supabase_auth_id;

-- Phase 6: Create migration function for data consolidation
CREATE OR REPLACE FUNCTION public.consolidate_user_data()
RETURNS TABLE(
    processed_users INTEGER,
    created_profiles INTEGER,
    migration_errors TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_processed INTEGER := 0;
    v_created INTEGER := 0;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    user_record RECORD;
BEGIN
    -- Ensure all auth users have profiles
    FOR user_record IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        BEGIN
            INSERT INTO public.profiles (id, system_role, created_at, updated_at)
            VALUES (user_record.id, 'Worker', now(), now());
            
            v_created := v_created + 1;
        EXCEPTION WHEN OTHERS THEN
            v_errors := array_append(v_errors, 'Failed to create profile for user: ' || user_record.id::text || ' - ' || SQLERRM);
        END;
    END LOOP;
    
    -- Count total processed users
    SELECT COUNT(*) INTO v_processed FROM auth.users;
    
    RETURN QUERY SELECT v_processed, v_created, v_errors;
END;
$$;