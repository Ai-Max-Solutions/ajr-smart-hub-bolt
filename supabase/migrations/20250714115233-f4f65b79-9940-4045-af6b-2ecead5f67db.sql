-- First, let's check if there are any problematic triggers and fix the auth user sync

-- Drop any existing problematic triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the proper trigger function for syncing auth users with our Users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into Users table when a new auth user is created
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
    last_sign_in
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
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    supabase_auth_id = EXCLUDED.supabase_auth_id,
    last_sign_in = EXCLUDED.last_sign_in,
    firstname = COALESCE(EXCLUDED.firstname, "Users".firstname),
    lastname = COALESCE(EXCLUDED.lastname, "Users".lastname),
    fullname = COALESCE(EXCLUDED.fullname, "Users".fullname);
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the sync_user_on_auth_change function is dropped if it exists as it might be conflicting
DROP FUNCTION IF EXISTS public.sync_user_on_auth_change() CASCADE;