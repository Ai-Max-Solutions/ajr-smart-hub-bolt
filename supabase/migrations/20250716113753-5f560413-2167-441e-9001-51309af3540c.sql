-- Phase 1: Fix Auth-Profile Creation (CRITICAL)
-- Reinstall handle_new_user trigger and fix profile creation system

-- First, ensure the profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    system_role text DEFAULT 'Worker'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace the handle_new_user function to work with both profiles and Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Insert into profiles table when new user signs up
    INSERT INTO public.profiles (id, system_role, created_at, updated_at)
    VALUES (NEW.id, 'Worker', now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    -- Check if user already exists by supabase_auth_id first
    IF EXISTS (SELECT 1 FROM public."Users" WHERE supabase_auth_id = NEW.id) THEN
        -- Update existing user
        UPDATE public."Users" 
        SET 
            last_sign_in = NOW(),
            email = NEW.email,
            firstname = COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', firstname),
            lastname = COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', lastname),
            fullname = COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', 
                       TRIM(COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                            COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', '')),
                       fullname)
        WHERE supabase_auth_id = NEW.id;
    ELSE
        -- Insert new user into Users table
        INSERT INTO public."Users" (
            whalesync_postgres_id,
            supabase_auth_id,
            email,
            firstname,
            lastname,
            fullname,
            role,
            system_role,
            employmentstatus,
            auth_provider,
            last_sign_in,
            airtable_created_time
        )
        VALUES (
            gen_random_uuid(),
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', 
                     TRIM(COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                          COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', '')),
                     split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'role', 'Operative'),
            COALESCE(NEW.raw_user_meta_data->>'system_role', 'Worker'),
            'Active',
            'supabase',
            NOW(),
            CURRENT_DATE
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it's properly installed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create email sync trigger for auth.users updates
CREATE OR REPLACE FUNCTION public.sync_auth_user_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Update Users table when auth.users email changes
    UPDATE public."Users" 
    SET 
        email = NEW.email,
        last_sign_in = CASE WHEN NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at 
                           THEN NEW.last_sign_in_at 
                           ELSE last_sign_in END
    WHERE supabase_auth_id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auth.users updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.sync_auth_user_updates();

-- Create profiles for any existing auth users missing profiles
INSERT INTO public.profiles (id, system_role, created_at, updated_at)
SELECT 
    au.id,
    'Worker',
    now(),
    now()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Add RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role full access" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Phase 2: Standardize User References and Add Sync Functions
-- Create function to sync data between profiles and Users tables
CREATE OR REPLACE FUNCTION public.sync_profiles_to_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- When profiles.system_role updates, sync to Users.system_role
    UPDATE public."Users" 
    SET system_role = NEW.system_role
    WHERE supabase_auth_id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Create trigger for profiles updates
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    AFTER UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.sync_profiles_to_users();

-- Phase 3: Fix AI Conversation User References
-- Update ai_conversations to use auth.users.id consistently
DO $$
BEGIN
    -- Check if ai_conversations table exists and fix user_id references
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_conversations' AND table_schema = 'public') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE public.ai_conversations DROP CONSTRAINT IF EXISTS ai_conversations_user_id_fkey;
        
        -- Add proper foreign key to auth.users
        ALTER TABLE public.ai_conversations 
        ADD CONSTRAINT ai_conversations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Phase 4: Add Missing Relationship Constraints
-- Fix notification system to use consistent user references
DO $$
BEGIN
    -- Update smart_notifications if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smart_notifications' AND table_schema = 'public') THEN
        -- Ensure proper foreign key exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'smart_notifications_user_id_fkey' 
                      AND table_name = 'smart_notifications') THEN
            ALTER TABLE public.smart_notifications 
            ADD CONSTRAINT smart_notifications_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Create data consistency validation function
CREATE OR REPLACE FUNCTION public.validate_data_consistency()
RETURNS TABLE(
    issue_type text,
    table_name text,
    issue_count bigint,
    description text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check for auth users without profiles
    RETURN QUERY
    SELECT 
        'missing_profiles'::text,
        'profiles'::text,
        COUNT(*)::bigint,
        'Auth users without corresponding profiles'::text
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL;
    
    -- Check for profiles without Users entries
    RETURN QUERY
    SELECT 
        'missing_users'::text,
        'Users'::text,
        COUNT(*)::bigint,
        'Profiles without corresponding Users entries'::text
    FROM public.profiles p
    LEFT JOIN public."Users" u ON u.supabase_auth_id = p.id
    WHERE u.supabase_auth_id IS NULL;
    
    -- Check for email mismatches
    RETURN QUERY
    SELECT 
        'email_mismatch'::text,
        'Users'::text,
        COUNT(*)::bigint,
        'Email mismatches between auth.users and Users table'::text
    FROM auth.users au
    JOIN public."Users" u ON u.supabase_auth_id = au.id
    WHERE au.email != u.email;
    
END;
$$;