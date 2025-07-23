
-- Step 1: Fix Database Function and Trigger Issues
-- Drop existing function and trigger to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if user already exists to prevent duplicates
    IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = NEW.id) THEN
        RETURN NEW;
    END IF;
    
    -- Insert new user with proper error handling
    INSERT INTO public.users (
        supabase_auth_id,
        email,
        name,
        role,
        account_status,
        is_verified,
        trial_expires_at,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                 COALESCE(NEW.raw_user_meta_data->>'last_name', '')),
            split_part(NEW.email, '@', 1)
        ),
        'Operative',
        'trial',
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        NOW() + INTERVAL '24 hours',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't block user creation
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger with proper error handling
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to manually create missing user profiles
CREATE OR REPLACE FUNCTION public.ensure_user_profile(auth_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    auth_user_record RECORD;
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth_user_id) THEN
        RETURN true;
    END IF;
    
    -- Get auth user data
    SELECT * INTO auth_user_record FROM auth.users WHERE id = auth_user_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Create user profile
    INSERT INTO public.users (
        supabase_auth_id,
        email,
        name,
        role,
        account_status,
        is_verified,
        trial_expires_at,
        created_at,
        updated_at
    ) VALUES (
        auth_user_record.id,
        auth_user_record.email,
        COALESCE(
            auth_user_record.raw_user_meta_data->>'full_name', 
            TRIM(COALESCE(auth_user_record.raw_user_meta_data->>'first_name', '') || ' ' || 
                 COALESCE(auth_user_record.raw_user_meta_data->>'last_name', '')),
            split_part(auth_user_record.email, '@', 1)
        ),
        'Operative',
        'trial',
        CASE WHEN auth_user_record.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        NOW() + INTERVAL '24 hours',
        NOW(),
        NOW()
    );
    
    RETURN true;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Failed to ensure user profile for %: %', auth_user_record.email, SQLERRM;
        RETURN false;
END;
$$;
