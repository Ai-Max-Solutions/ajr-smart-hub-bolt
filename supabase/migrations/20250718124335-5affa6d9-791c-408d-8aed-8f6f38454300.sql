-- First, manually update the user role to Admin
UPDATE public.users 
SET role = 'Admin'
WHERE email = 'mc@ajryan.co.uk';

-- Fix the handle_new_user function to prevent role overwriting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Only insert if the user doesn't already exist
    INSERT INTO public.users (
        supabase_auth_id,
        email,
        name,
        role
    ) 
    SELECT 
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 
            TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                 COALESCE(NEW.raw_user_meta_data->>'last_name', ''))),
        'Operative'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.users WHERE supabase_auth_id = NEW.id
    );
    
    RETURN NEW;
END;
$function$;