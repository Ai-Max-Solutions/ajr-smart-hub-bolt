-- Force-set your role to Admin (again, but this time it will stick)
UPDATE public.users 
SET role = 'Admin'
WHERE email = 'mc@ajryan.co.uk';

-- Step 1: Drop ALL triggers on auth.users to clear any ghosts
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

-- Step 2: Drop the function if exists (clean slate)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Recreate function – ONLY for brand-new users, no updates!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Strict check: If user exists (by auth ID), do NOTHING – no update!
    IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = NEW.id) THEN
        RETURN NEW;  -- Exit, no changes – keep existing role!
    END IF;
    
    -- Only for new users: Insert with default 'Operative'
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

-- Step 4: Recreate trigger ONLY on INSERT (not update/login refresh)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();