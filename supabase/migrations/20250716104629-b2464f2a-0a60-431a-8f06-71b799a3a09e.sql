-- Phase 4: Add unique constraints for data integrity
-- Clean up any duplicate emails using a different approach for UUID
WITH duplicate_emails AS (
    SELECT email, array_agg(whalesync_postgres_id ORDER BY airtable_created_time ASC NULLS LAST) as ids
    FROM public."Users" 
    WHERE email IS NOT NULL
    GROUP BY email 
    HAVING COUNT(*) > 1
)
DELETE FROM public."Users" 
WHERE whalesync_postgres_id IN (
    SELECT unnest(ids[2:]) 
    FROM duplicate_emails
);

-- Add unique constraint on email
ALTER TABLE public."Users" ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Phase 5: Create auto-signup trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into profiles table when new user signs up
    INSERT INTO public.profiles (id, system_role)
    VALUES (NEW.id, 'Worker')
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Phase 6: Create unified user view for easier querying
CREATE OR REPLACE VIEW public.user_view AS
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    p.system_role,
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

-- Phase 7: Create migration function for data consolidation
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
            INSERT INTO public.profiles (id, system_role)
            VALUES (user_record.id, 'Worker');
            
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