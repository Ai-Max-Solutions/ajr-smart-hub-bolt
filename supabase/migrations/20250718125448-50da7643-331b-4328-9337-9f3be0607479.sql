-- First, let's see what's in the users table for your account
-- Then completely remove any triggers that might be interfering

-- Drop ALL triggers on auth.users to stop any interference
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'users' AND event_object_schema = 'auth'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON auth.users';
    END LOOP;
END $$;

-- Now force set your role to Admin again
UPDATE public.users 
SET role = 'Admin'
WHERE email = 'mc@ajryan.co.uk';

-- Create a much simpler function that ONLY inserts NEW users and NEVER updates existing ones
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Check if user already exists and EXIT if they do
    IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = NEW.id) THEN
        RETURN NEW;  -- Exit without doing anything
    END IF;
    
    -- Only insert if this is truly a new user
    INSERT INTO public.users (
        supabase_auth_id,
        email,
        name,
        role
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 
            TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                 COALESCE(NEW.raw_user_meta_data->>'last_name', '')), 
            'Unknown'),
        'Operative'
    );
    
    RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();